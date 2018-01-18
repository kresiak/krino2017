import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'
import { AuthService } from './auth.service'
import { ApiService } from './api.service'
import { OtpChoiceService } from './otp-choice.service'
import { ProductService } from './product.service'
import { VoucherService } from './voucher.service'
import { OtpService } from './otp.service'
import { SelectableData } from './../Classes/selectable-data'
import { SharedObservable } from './../Classes/shared-observable'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import * as utils from './../Utils/observables'
import * as dateUtils from './../Utils/dates'

Injectable()
export class BasketService {

    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService,
        @Inject(ApiService) private apiService: ApiService, @Inject(OtpChoiceService) private otpChoiceService: OtpChoiceService,
        @Inject(OtpService) private otpService: OtpService,
        @Inject(ProductService) private productService: ProductService) {

    }



    // basket
    // ======

    //    get basket
    //    ==========

    getBasketProductsSetForCurrentUser(): Observable<any> {
        return this.getBasketItemsForUser(this.authService.getUserIdObservable()).map(list => {
            return list.reduce((map, p) => {
                map.set(p.produit, p)
                return map
            }, new Map())
        })
    }



    getBasketItemsForCurrentUser(): Observable<any> {
        return this.getBasketItemsForUser(this.authService.getUserIdObservable())
    }

    getBasketItemsForGroupOrdersUser(): Observable<any> {
        return this.getBasketItemsForUser(this.authService.getGroupOrdersUserIdObservable())
    }

    private getBasketItemsForUser(userIdObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('basket'),
            userIdObservable,
            (basket, userId) => {
                return basket.filter(basketItem => basketItem.user === userId);
            }
        );
    }

    getBasketItemsForGroupOrdersUserWithCurrentUserParticipation(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('basket'),
            this.authService.getGroupOrdersUserIdObservable(),
            this.authService.getUserIdObservable(),
            (basket, groupOrdersUserId, currentUserId) => {
                return basket.filter(basketItem => basketItem.user === groupOrdersUserId && basketItem.items && basketItem.items.map(item => item.userId).includes(currentUserId));
            }
        );
    }

    private emptyObservable(): Observable<any> {
        return Observable.from([[]])         // we need the double [[]]   the emptyobservable has to return a first value. Otherwise combineLatest gets stuck
    }

    private getAnnotatedProductsInUserBasketBySupplier(supplierId, basketObservable: Observable<any>, otpNeeded: boolean): Observable<any> {
        return Observable.combineLatest(this.productService.getProductsBySupplier(supplierId).map(utils.hashMapFactory), basketObservable,
            this.otpService.getAnnotatedOtpsMap(),
            this.authService.getUserIdObservable(), this.authService.getEquipeIdObservable(),
            this.dataStore.getDataObservable('equipes'), this.dataStore.getDataObservable('otp.product.classifications'), this.authService.getAnnotatedUsers(), this.dataStore.getDataObservable('currencies'),
            (productsMap, basketItems, otpsBudgetMap, currentUserId, currentEquipeId, equipes, classifications, annotatedUsers, currencies) => {
                var items = basketItems.filter(item => productsMap.has(item.produit)).map(basketItemFiltered => {
                    var otpNeededForThisProduct: boolean = otpNeeded && !basketItemFiltered.isFixCost
                    let product = productsMap.get(basketItemFiltered.produit)
                    let productCategories: string[] = product.categoryIds ? product.categoryIds : []
                    let productClassificationId = classifications.filter(c => c.categoryIds && c.categoryIds.filter(catId => productCategories.includes(catId)).length > 0).map(c => c._id)[0]
                    let currency= ! product.currencyId ? 'EUR' : (currencies.filter(c => c._id === product.currencyId)[0] || {'name': '???'}).name
                    let exchangeRate: number= ! product.currencyId ? 1 : (currencies.filter(c => c._id === product.currencyId)[0] || {'conversionToEuro': 1}).conversionToEuro

                    return {
                        data: product,
                        annotation: {
                            currency: currency,
                            exchangeRate: exchangeRate,                            
                            classificationId: productClassificationId,
                            isFixCost: basketItemFiltered.isFixCost,
                            basketId: basketItemFiltered._id,
                            basketData: basketItemFiltered,
                            basketItems: !basketItemFiltered.items ? [] : basketItemFiltered.items.map(item => {
                                let user = annotatedUsers.filter(user => user.data._id === item.userId)[0]
                                let equipe = equipes.filter(eq => eq._id === item.equipeId)[0]
                                return {
                                    data: item,
                                    annotation: {
                                        userFullName: user ? user.annotation.fullName : 'unknown user',
                                        equipe: equipe ? equipe.name : 'unknown equipe'
                                    }
                                }
                            }),
                            hasCurrentUserPermissionToShop: !product.userIds || product.userIds.includes(currentUserId),
                            quantity: basketItemFiltered.quantity,
                            totalPrice: product.price * basketItemFiltered.quantity * (1 + (product.tva == 0 ? 0 : product.tva || 21) / 100) * exchangeRate,
                            totalPriceHTva: product.price * basketItemFiltered.quantity * exchangeRate,
                            otp: basketItemFiltered.otpId ? { name: 'will never be used, or?', _id: basketItemFiltered.otpId, description: otpsBudgetMap.has(basketItemFiltered.otpId) ? otpsBudgetMap.get(basketItemFiltered.otpId).data.description :  ''  } :
                                otpNeededForThisProduct ? this.otpChoiceService.determineOtp(product, classifications, basketItemFiltered.quantity, otpsBudgetMap, currentEquipeId, currentUserId) : null
                        }
                    }
                })

                var itemWithHighestPrice = items.filter(i => !i.annotation.isFixCost && i.annotation.otp).sort((a, b) => b.annotation.totalPrice - a.annotation.totalPrice)[0]
                if (itemWithHighestPrice) {
                    items.filter(i => i.annotation.isFixCost).forEach(i => {
                        i.annotation.otp = itemWithHighestPrice.annotation.otp
                    })
                }

                return items
            }
        );
    }


    getAnnotatedProductsInCurrentUserBasketBySupplier(supplierId): Observable<any>   // getAnnoted results cannot be used to resave into database
    {
        return this.getAnnotatedProductsInUserBasketBySupplier(supplierId, this.getBasketItemsForCurrentUser(), false)
    }

    getAnnotatedProductsInGroupOrdersUserBasketBySupplier(supplierId): Observable<any>   // getAnnoted results cannot be used to resave into database
    {
        return this.getAnnotatedProductsInUserBasketBySupplier(supplierId, this.getBasketItemsForGroupOrdersUser(), false)
    }

    getAnnotatedProductsInCurrentUserBasketBySupplierWithOtp(supplierId): Observable<any>   // getAnnoted results cannot be used to resave into database
    {
        return this.getAnnotatedProductsInUserBasketBySupplier(supplierId, this.getBasketItemsForCurrentUser(), true)
    }

    /*    getAnnotatedProductsInGroupOrdersUserBasketBySupplierWithOtp(supplierId): Observable<any>   // getAnnoted results cannot be used to resave into database
        {
            return this.getAnnotatedProductsInUserBasketBySupplier(supplierId, this.getBasketItemsForGroupOrdersUser(), true)        
        }
    */



    //     modify basket
    //     =============

    addFixCostToBasket(supplierId) {
        Observable.zip(this.getBasketItemsForCurrentUser().take(1), this.productService.getFixCostsBySupplier(supplierId).take(1),
            this.authService.getUserIdObservable().take(1), (basketItems, fixCosts, userId) => {
                return fixCosts.filter(c => !basketItems.map(bi => bi.produit).includes(c._id)).map(fc => {
                    return {
                        user: userId,
                        produit: fc._id,
                        quantity: 1,
                        isFixCost: true
                    }
                })
            }).take(1).switchMap(fcList => {
                if (!fcList || fcList.length === 0) return Observable.from([{}])
                return Observable.forkJoin(fcList.map(fc => {
                    return this.dataStore.addData('basket', fc)
                }))
            }).subscribe(res => {

            })
    }


    doBasketOtpUpdate(product, otpId: string) {
        this.dataStore.updateData('basket', product.annotation.basketId, { user: this.authService.getUserId(), produit: product.data._id, quantity: product.annotation.quantity, otpId: otpId });
    }

    doBasketUpdate(productAnnotated, quantity: string) {
        var q: number = +quantity && (+quantity) >= 0 ? +quantity : 0;
        if (!productAnnotated.annotation.basketId && q > 0) {
            this.createBasketItem(productAnnotated.data, q);
        }
        if (productAnnotated.annotation.basketId && q === 0) {
            this.removeBasketItem(productAnnotated.annotation.basketId);
        }
        if (productAnnotated.annotation.basketId && q > 0 && q !== productAnnotated.annotation.quantity) {
            this.updateBasketItem(productAnnotated.annotation.basketId, productAnnotated.data, q);
        }
    }

    doBasketNotUrgent(productAnnotated): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('basket'), (basket) => {
            var groupOrderUserId = this.authService.systemGroupUserId
            var nonUrgentBasketItem = basket.filter(item => item.user === groupOrderUserId && item.produit === productAnnotated.data._id)[0]
            let now = dateUtils.nowFormated()
            var item = {
                date: now,
                userId: this.authService.getUserId(),
                equipeId: this.authService.getEquipeId(),
                quantity: productAnnotated.annotation.quantity
            }

            if (nonUrgentBasketItem) {
                if (!nonUrgentBasketItem.items) nonUrgentBasketItem.items = []
                nonUrgentBasketItem.items.push(item)
                nonUrgentBasketItem.quantity += productAnnotated.annotation.quantity
                this.dataStore.updateData('basket', nonUrgentBasketItem._id, nonUrgentBasketItem)
            }
            else {
                this.dataStore.addData('basket', {
                    user: groupOrderUserId,
                    produit: productAnnotated.data._id,
                    quantity: productAnnotated.annotation.quantity,
                    items: [item]
                })
            }
            this.removeBasketItem(productAnnotated.annotation.basketId)
        })
    }

    private createBasketItem(product, quantity: number) {
        this.dataStore.addData('basket', { user: this.authService.getUserId(), produit: product._id, quantity: quantity });
    }

    private updateBasketItem(basketItemId, product, quantity: number) {
        this.dataStore.updateData('basket', basketItemId, { user: this.authService.getUserId(), produit: product._id, quantity: quantity });
    }

    private removeBasketItem(basketItemId) {
        this.dataStore.deleteData('basket', basketItemId);
    }


    //     create order from basket
    //     ========================


    private logOrderRecord(record) {
        let data = record.data
        var total = data.items.map(item => item.total).reduce((a, b) => +a + +b, 0)

        this.dataStore.addData('orders.log', {
            type: 'user',
            amount: +total,
            id: data.userId,
            orderId: data._id
        })

        if (data.equipeId) {
            this.dataStore.addData('orders.log', {
                type: 'equipe',
                amount: +total,
                id: data.equipeId,
                orderId: data._id
            })
        }

        if (data.equipeRepartition) {
            this.dataStore.addData('orders.log', {
                type: 'group',
                amount: +total,
                id: data.equipeRepartition.equipeGroupId,
                orderId: data._id
            })
        }

        data.items.filter(item => item.otpId).reduce((map, item) => {
            if (!map.has(item.otpId)) map.set(item.otpId, 0)
            map.set(item.otpId, map.get(item.otpId) + item.total)
            return map
        }, new Map()).forEach((value, key) => {
            this.dataStore.addData('orders.log', {
                type: 'otp',
                amount: +value,
                id: key,
                orderId: data._id
            })
        })

        data.items.filter(item => item.categoryId).reduce((map, item) => {
            if (!map.has(item.categoryId)) map.set(item.categoryId, 0)
            map.set(item.categoryId, map.get(item.categoryId) + item.total)
            return map
        }, new Map()).forEach((value, key) => {
            this.dataStore.addData('orders.log', {
                type: 'category',
                amount: +value,
                id: key,
                orderId: data._id
            })
        })

    }

    private passCommand(record): Observable<any> {
        this.dataStore.setLaboNameOnRecord(record.data)
        var obs = this.apiService.callWebService('passOrder', record);

        obs.combineLatest(this.dataStore.getDataObservable('products'), (res, products) => {
            record.data._id = res._id
            record.data.items.forEach(item => {
                let product = products.filter(p => p._id === item.productId)[0]
                if (product && product.categoryIds && product.categoryIds[0]) {
                    item.categoryId = product.categoryIds[0]
                }
            })
            return record
        }).first().subscribe(rec => {
            this.logOrderRecord(rec)
        });
        return obs;
    }




    createOrderFromBasket(products, supplierId, equipeGroup): Observable<any> {   // return an observable with the db id of new order 
        if (!products || products.length < 1) return null;

        if (products.filter(product => !product.annotation.otp._id).length > 0) return null;

        var record = {
            data: {
                userId: this.authService.getUserId(),
                //equipeId: this.authService.getEquipeId(),
                supplierId: supplierId,
                items: products.filter(product => product.annotation.quantity > 0 && !product.data.disabled).map(product => {
                    var obj: any = {
                        productId: product.data._id,
                        quantity: product.annotation.quantity,
                        otpId: product.annotation.otp._id,
                        total: product.annotation.totalPrice
                    };
                    if (product.annotation.basketData.items) {
                        obj.detail = product.annotation.basketData.items
                    }
                    return obj
                })
            },
            basketItems: products.filter(product => product.annotation.quantity > 0 && !product.data.disabled).map(product => product.annotation.basketId)
        };

        if (equipeGroup) {
            record.data['equipeRepartition'] = { equipeGroupId: equipeGroup.data._id }
            record.data['equipeRepartition']['repartition'] = equipeGroup.annotation.equipes.map(eq => {
                return {
                    equipeId: eq.data.id,
                    weight: eq.annotation.pc
                }
            })
        }
        else {
            record.data['equipeId'] = this.authService.getEquipeId()
        }

        return this.passCommand(record);
    }
}