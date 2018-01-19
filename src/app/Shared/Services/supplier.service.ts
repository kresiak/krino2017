import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { BasketService } from './basket.service'
import { VoucherService } from './voucher.service'


import { SelectableData } from 'gg-basic-code'
import { Observable, Subscription } from 'rxjs/Rx'
import * as moment from "moment"
import {utilsObservables as utils} from 'gg-basic-code'

Injectable()
export class SupplierService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(BasketService) private basketService: BasketService,
                @Inject(AuthService) private authService: AuthService,
                @Inject(VoucherService) private voucherService: VoucherService) { }

    getSupplier(supplierId): Observable<any> {
        return this.dataStore.getDataObservable('suppliers').map(suppliers => {
            var x = suppliers.filter(supplier => supplier._id === supplierId);
            return x && x.length > 0 ? x[0] : null;
        })
    }

/*    private hasSupplierBasketItems(supplierId, produits, basketitems: any[]): boolean {
        return produits.filter(produit => produit.supplierId === supplierId).filter(produit => basketitems.map(item => item.produit).includes(produit._id)).length > 0;
    }
*/
    private supplierIdsInBasketItems(produitsMap, basketitems: any[]): Set<string> {
        var supplierIdSet = new Set<string>()
        basketitems.forEach(item => {
            var product = produitsMap.get(item.produit)
            if (product && !supplierIdSet.has(product.supplierId)) {
                supplierIdSet.add(product.supplierId)
            }
        })
        return supplierIdSet
    }


    private getSupplierIdsSetObservableInBasketItems(basketItemsObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('products').map(utils.hashMapFactory), basketItemsObservable,
            (productsMap, basketItems) => {
                return this.supplierIdsInBasketItems(productsMap, basketItems)
            })
    }

    getSupplierIdsSetObservableWithBasketForCurrentUser(): Observable<any> {
        return this.getSupplierIdsSetObservableInBasketItems(this.basketService.getBasketItemsForCurrentUser())
    }

    getSupplierIdsSetObservableWithBasketForGroupOrdersUser(): Observable<any> {
        return this.getSupplierIdsSetObservableInBasketItems(this.basketService.getBasketItemsForGroupOrdersUser())
    }

    getSupplierIdsSetObservableWithCurrentUserParticipationInGroupsOrder(): Observable<any> {
        return this.getSupplierIdsSetObservableInBasketItems(this.basketService.getBasketItemsForGroupOrdersUserWithCurrentUserParticipation())
    }

    getAnnotatedSupplierseWithBasketForCurrentUser(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedSuppliers(), this.getSupplierIdsSetObservableWithBasketForCurrentUser(),
                    (annotatedSuppliers, supplierIdsSet) => {
                        return annotatedSuppliers.filter(s => supplierIdsSet.has(s.data._id))
                    })
    }

    getAnnotatedSupplierseWithCurrentUserParticipationInGroupsOrder(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedSuppliers(), this.getSupplierIdsSetObservableWithCurrentUserParticipationInGroupsOrder(),
                    (annotatedSuppliers, supplierIdsSet) => {
                        return annotatedSuppliers.filter(s => supplierIdsSet.has(s.data._id))
                    })
    }

    private getSupplierFrequenceMapObservable(): Observable<Map<string, number>> {    // parse the orders in a linear way to create a map supplier => nb orders    
        return this.dataStore.getDataObservable('orders').map(orders => orders.reduce((map, order) => {
            let supplierId = order.supplierId
            if (supplierId) {
                if (!map.has(supplierId)) map.set(supplierId, 0)
                map.set(supplierId, map.get(supplierId) + 1)
            }
            return map
        }, new Map()))
    }


    getAnnotatedSuppliers(): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('suppliers'), this.dataStore.getDataObservable('products'), this.getSupplierFrequenceMapObservable(),
            this.voucherService.getVoucherMapForCurrentUser(), this.dataStore.getDataObservable('categories'),
            (suppliers, produits, supplierFrequenceMap, voucherMap, categories) => {
                if (!this.authService.getUserId() || (!this.authService.getEquipeId() && !this.authService.isCurrentUserGroupOrderUser())) return [];

                return suppliers.map(supplier => {
                    let voucherCategoryMap = voucherMap && voucherMap.get(supplier._id) ? voucherMap.get(supplier._id)['categoryMap'] : undefined
                    let fixCosts= produits.filter(p => p.isFixCost && p.supplierId === supplier._id)
                    return {
                        data: supplier,
                        annotation: {
                            supplierFrequence: supplierFrequenceMap.get(supplier._id) || 0,
                            voucherCategoryMap: voucherCategoryMap,
                            nbFixCosts: fixCosts ? fixCosts.length : 0,
                            webShopping: {
                                categories: supplier.webShopping && supplier.webShopping.categoryIds ? supplier.webShopping.categoryIds.map(categoryId => {
                                    let category = categories.filter(cat => cat._id === categoryId)[0]
                                    return {
                                        id: categoryId,
                                        name: category ? category.name : 'unknown category'
                                    }
                                }) : [],
                                isEnabled: supplier.webShopping && supplier.webShopping.isEnabled,
                                nbTotalVouchers: !voucherCategoryMap ? 0 : Array.from(voucherCategoryMap.values()).reduce((acc, value) => acc + value['vouchers'].length, 0),
                                nbVouchersOrdered: !voucherCategoryMap ? 0 : Array.from(voucherCategoryMap.values()).reduce((acc, value) => acc + value['nbVouchersOrdered'], 0)
                            }
                        }
                    }
                });
            }
        );
    }

    getAnnotatedSuppliersByFrequence(): Observable<any> {
        return this.getAnnotatedSuppliers().map(prods => prods.sort((a, b) => {
            return b.annotation.supplierFrequence !== a.annotation.supplierFrequence ? (b.annotation.supplierFrequence - a.annotation.supplierFrequence) :
              (a.data.name < b.data.name ? -1 : 1)
            
        }));
    }



    getAnnotatedSupplierById(id: string): Observable<any> {
        return this.getAnnotatedSuppliers().map(suppliers => {
            let supplier = suppliers.filter(s => s.data._id === id)[0];
            return supplier ? supplier : null;
        });
    }

    getAnnotatedSupplierBySapId(sapId: string): Observable<any> {
        return this.getAnnotatedSuppliers().map(suppliers => {
            let supplier = suppliers.filter(s => s.data.sapId === sapId)[0];
            return supplier ? supplier : null;
        });
    }

    getAnnotatedWebSuppliers(): Observable<any> {
        return this.getAnnotatedSuppliers().map(annotatedSuppliers => annotatedSuppliers.filter(annotatedSupplier =>
            annotatedSupplier.data.webShopping && annotatedSupplier.data.webShopping.isEnabled && annotatedSupplier.annotation.webShopping.categories.length > 0))
    }


    /*    getAnnotatedSuppliers2(): Observable<any> {
            return Observable.combineLatest(this.dataStore.getDataObservable('suppliers'),
                (suppliers) => {
                    return suppliers.map(supplier => {
                        return {
                            data: supplier,
                            annotation: {
                                hasBasket: false
                            }
                        }
                    });
                }
            );
        }*/


}