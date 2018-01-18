import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import * as utilsDate from './../Utils/dates'

Injectable()
export class StockService {


    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService) {

    }


    private productDoubleObservable: ConnectableObservable<any> = null

    private createAnnotatedStockProduct(productStock, products, suppliers, unprocessedStockOrders, currentUserId) {
        if (!productStock) return null;
        let product = products.filter(p => p._id === productStock.productId)[0]
        if (!product) return
        let supplier = suppliers.filter(s => s._id === product.supplierId)[0]

        let nbSold = !productStock.sales ? 0 : productStock.sales.reduce((acc, sale) => acc + sale.quantity, 0);
        let nbReservedByMe = unprocessedStockOrders.filter(order => order.productId === productStock.productId && order.userId === currentUserId).map(order => +order.quantity).reduce((a, b) => {
            return a + b
        }, 0)
        return {
            data: productStock,
            annotation: {
                supplier: supplier ? supplier.name : 'unknown supplier',
                product: product.name + ' ' + productStock.package,
                catalogNr: product.catalogNr,
                nbInitialInStock: productStock.quantity,
                lotNb: productStock.lotNumber,
                nbSold: nbSold,
                nbAvailable: productStock.quantity - nbSold,
                nbReservedByMe: nbReservedByMe
            }
        };
    }

    private getAnnotatedStockProducts(productsStockObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(productsStockObservable, this.dataStore.getDataObservable('products'), this.dataStore.getDataObservable('suppliers'),
            this.dataStore.getDataObservable('orders.stock'), this.authService.getUserIdObservable(), (productsStock, products, suppliers, stockOrders, currentUserId) => {
                let unprocessedStockOrders = stockOrders.filter(order => !order.isProcessed)
                return productsStock.map(productStock => this.createAnnotatedStockProduct(productStock, products, suppliers, unprocessedStockOrders, currentUserId));
            });
    }

    private getAnnotatedAvailableStockProducts(productsStockObservable: Observable<any>): Observable<any> {
        return this.getAnnotatedStockProducts(productsStockObservable)
            .map(annotatedStockProducts => annotatedStockProducts.filter(annotatedStockProduct => annotatedStockProduct && annotatedStockProduct.annotation.nbAvailable > 0));
    }


    getAnnotatedAvailableStockProductsByProduct(productId): Observable<any> {
        return this.getAnnotatedAvailableStockProducts(this.dataStore.getDataObservable('products.stock').map(stockProducts => stockProducts.filter(sp => sp.productId === productId)));
    }

    getAnnotatedStockProductsAll(): Observable<any> {
        return this.getAnnotatedStockProducts(this.dataStore.getDataObservable('products.stock')).map(sps => sps.groupBy(sp => sp.data.productId));
    }

/*    getNbAvailableInStockByProduct(): Observable<any> {
        return this.getAnnotatedAvailableStockProductsAll().map(groups =>
            groups.map(group => {
                return {
                    productId: group.key,
                    nbAvailable: group.values.reduce((acc, stockItem) => acc + stockItem.annotation.nbAvailable, 0)
                }
            }));
    }
*/

    // Stock orders
    // ============

    private createAnnotatedStockOrder(orderStock, equipes, annotatedUsers, products, stockItems) {
        if (!orderStock) return null;

        var orderProcessItems: any[] = []
        stockItems.filter(item => orderStock.stockItemIds && orderStock.stockItemIds.includes(item._id)).forEach(item => {
            item.sales.filter(itemSale => itemSale.stockOrderId === orderStock._id).forEach(itemSale => {
                orderProcessItems.push({
                    date: itemSale.date,
                    quantity: itemSale.quantity,
                    lotNb: item.lotNumber
                })
            })
        })

        let equipe = equipes.filter(equipe => equipe._id === orderStock.equipeId)[0];
        let user = annotatedUsers.filter(user => user.data._id === orderStock.userId)[0];
        let product = products.filter(product => product._id === orderStock.productId)[0];
        return {
            data: orderStock,
            annotation: {
                product: product ? product.name + ' / ' + (product.stockPackage || product.package) : 'unknown product',
                catalogNr: product ? product.catalogNr : '',
                user: user ? user.annotation.fullName : 'unknown User',
                equipe: equipe ? equipe.name : 'unknown equipe',
                orderProcessItems: orderProcessItems
            }
        };
    }

    getAnnotatedStockOrders(ordersStockObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(ordersStockObservable, this.dataStore.getDataObservable('equipes'), this.authService.getAnnotatedUsers(), this.dataStore.getDataObservable('products'),
            this.dataStore.getDataObservable('products.stock'),
            (ordersStock, equipes, annotatedUsers, products, stockItems, annotatedOrders) => {
                return ordersStock.map(orderStock => this.createAnnotatedStockOrder(orderStock, equipes, annotatedUsers, products, stockItems)).sort(utilsDate.getSortFn(x => x.data.createDate));
            });
    }

    getAnnotatedStockOrdersAll(): Observable<any> {
        return this.getAnnotatedStockOrders(this.dataStore.getDataObservable('orders.stock'))
    }

    getAnnotatedStockOrdersByCurrentUser(): Observable<any> {
        var stockOrdersObservable = Observable.combineLatest(this.dataStore.getDataObservable('orders.stock'), this.authService.getUserIdObservable(), (orders, userId) => {
            return orders.filter(order => order.userId === userId)
        })
        return this.getAnnotatedStockOrders(stockOrdersObservable)
    }

    getAnnotatedStockOrdersByUser(userId): Observable<any> {
        var stockOrdersObservable = this.dataStore.getDataObservable('orders.stock').map(orders => orders.filter(order => order.userId === userId))
        return this.getAnnotatedStockOrders(stockOrdersObservable)
    }

    getAnnotatedStockOrdersByEquipe(equipeId): Observable<any> {
        var stockOrdersObservable = this.dataStore.getDataObservable('orders.stock').map(orders => orders.filter(order => order.equipeId === equipeId))
        return this.getAnnotatedStockOrders(stockOrdersObservable)
    }
}