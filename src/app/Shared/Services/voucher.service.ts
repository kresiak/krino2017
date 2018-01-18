import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { ApiService } from 'gg-basic-data-services'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import * as utils from './../Utils/observables'
import * as utilsDate from './../Utils/dates'

Injectable()
export class VoucherService {


    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService,
        @Inject(ApiService) private apiService: ApiService) {
    }

    // web shopping
    // ============

    // return map suppliedId => {
    //          supplierName: string,
    //          categoryMap: categoryId: string => {
    //                  categoryName: string,
    //                  nbVouchersOrdered: number,
    //                  vouchers: array of vouchers as in database
    //              }    
    //     }

    getVoucherMapForCurrentUser(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('users.krino'),
            this.dataStore.getDataObservable('categories'),
            this.dataStore.getDataObservable('suppliers'),
            this.dataStore.getDataObservable('orders.vouchers'),
            this.authService.getUserIdObservable(),
            (users, categories, suppliers, vouchers, userId) => {
                let user = users.filter(user => user._id === userId)[0]
                let supplierMap = new Map()
                if (!user) return null;

                var initMapIfNecessary = function (supplierId, categoryId) {
                    if (!supplierMap.has(supplierId)) {
                        supplierMap.set(supplierId, {
                            supplierName: suppliers.filter(supplier => supplier._id === supplierId)[0] || 'unknown supplier',
                            categoryMap: new Map()
                        })
                    }
                    let categoryMap = supplierMap.get(supplierId)['categoryMap']
                    if (!categoryMap.has(categoryId)) {
                        categoryMap.set(categoryId, {
                            categoryName: categories.filter(category => category._id === categoryId)[0] || 'unknown category',
                            nbVouchersOrdered: 0,
                            vouchers: []
                        })
                    }
                };

                (user.voucherRequests || []).forEach(request => {
                    initMapIfNecessary(request.supplierId, request.categoryId)
                    supplierMap.get(request.supplierId)['categoryMap'].get(request.categoryId)['nbVouchersOrdered'] = request.quantity
                })

                vouchers.filter(voucher => !voucher.shopping && voucher.userId === userId).forEach(voucher => {
                    initMapIfNecessary(voucher.supplierId, voucher.categoryId)
                    supplierMap.get(voucher.supplierId)['categoryMap'].get(voucher.categoryId)['vouchers'].push(voucher)
                })

                return supplierMap
            }
        );
    }

    getOpenRequestedVouchers(): Observable<any[]> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('users.krino'),
            this.dataStore.getDataObservable('categories'),
            this.dataStore.getDataObservable('suppliers'),
            (users, categories, suppliers) => {
                let list = []

                users.filter(user => user.voucherRequests && user.voucherRequests.filter(req => req.quantity > 0).length > 0).forEach(user => {
                    user.voucherRequests.forEach(request => {
                        if (request.quantity > 0) {
                            let supplier = suppliers.filter(supplier => supplier._id === request.supplierId)[0]
                            let category = categories.filter(category => category._id === request.categoryId)[0]
                            list.push({
                                userId: user._id,
                                userName: user.firstName + ' ' + user.name,
                                supplierId: request.supplierId,
                                supplierName: supplier ? supplier.name : 'unknown supplier',
                                categoryId: request.categoryId,
                                categoryName: category ? category.name : 'unknown category',
                                quantity: request.quantity
                            })
                        }
                    })
                })

                return list.sort((a1, a2) => {
                    if (a1.supplierName === a2.supplierName) {
                        return a1.categoryName < a2.categoryName ? -1 : 1
                    }
                    return a1.supplierName < a2.supplierName ? -1 : 1
                })
            }
        );
    }

    public createVoucher(record): Observable<any> {
        this.dataStore.setLaboNameOnRecord(record)
        var obs = this.apiService.callWebService('createVoucher', record);

        obs.subscribe(res => {
            //this.dataStore.triggerDataNext('users.krino');
            //this.dataStore.triggerDataNext('orders.vouchers');
        });
        return obs;
    }

    public useVoucherForCurrentUser(supplierId: string, categoryId: string, amount: number, description: string): Observable<any> {
        let record = {
            userId: this.authService.getUserId(),
            equipeId: this.authService.getEquipeId(),
            supplierId: supplierId,
            categoryId: categoryId,
            amount: amount,
            description: description
        }

        var obs = this.apiService.callWebService('useVoucher', record)

        obs.subscribe(res => {
            //if (!res.error)                this.dataStore.triggerDataNext('orders.vouchers');
        });
        return obs;
    }



    private createAnnotatedVoucher(voucher, users: any[], categories: any[], suppliers: any[], equipes: any[]) {
        if (!voucher) return null;

        let user = users.filter(user => user._id === voucher.userId)[0]
        let category = categories.filter(category => category._id === voucher.categoryId)[0]
        let supplier = suppliers.filter(supplier => supplier._id === voucher.supplierId)[0]
        let equipe = !voucher.shopping ? null : equipes.filter(equipe => equipe._id === voucher.shopping.equipeId)[0]

        return {
            data: voucher,
            annotation:
            {
                user: user ? user.firstName + ' ' + user.name : 'unknown user',
                category: category ? category.name : 'unknown category',
                supplier: supplier ? supplier.name : 'unknown supplier',
                isUsed: voucher.shopping ? true : false,
                isInSap: voucher.shopping && voucher.shopping.isSapUpdated,
                status: !voucher.shopping ? 'available' : (voucher.shopping.isSapUpdated ? 'used' : 'used/tell Sap'),
                equipe: equipe ? equipe.name : 'not yet equipe'
            }
        }
    }

    getAnnotatedVouchers(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('orders.vouchers'),
            this.dataStore.getDataObservable('users.krino'),
            this.dataStore.getDataObservable('categories'),
            this.dataStore.getDataObservable('suppliers'),
            this.dataStore.getDataObservable('equipes'),
            (vouchers, users, categories, suppliers, equipes) => {
                return vouchers.map(voucher => this.createAnnotatedVoucher(voucher, users, categories, suppliers, equipes))
            });
    }

    getAnnotatedVouchersByCreationDate(): Observable<any> {
        return this.getAnnotatedVouchers().map(vouchers => vouchers.sort(utilsDate.getSortFn(x => x.data.dateCreation)))
    }

    getAnnotatedUsedVouchersByDate(): Observable<any> {
        return this.getAnnotatedVouchers().map(vouchers => vouchers.filter(voucher => voucher.annotation.isUsed).sort(utilsDate.getSortFn(x => x.data.shopping.date)))
    }

    getAnnotatedUsedVouchersOfCurrentUserByDate(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedUsedVouchersByDate(), this.authService.getUserIdObservable(), (vouchers, userId) => {
            return vouchers.filter(voucher => voucher.data.userId === userId)
        })
    }

    getAnnotatedUsedVouchersOfUserByDate(userId): Observable<any> {
        return this.getAnnotatedUsedVouchersByDate().map(vouchers => vouchers.filter(v => v.data.userId === userId))
    }

    getAnnotatedUsedVouchersOfEquipeByDate(equipeId): Observable<any> {
        return this.getAnnotatedUsedVouchersByDate().map(vouchers => vouchers.filter(v => v.data.shopping && v.data.shopping.equipeId === equipeId))
    }

    getAnnotatedUsedVouchersReadyForSap(): Observable<any> {
        return this.getAnnotatedVouchers().map(vouchers => vouchers.filter(voucher => voucher.annotation.isUsed && !voucher.annotation.isInSap))
    }



    

}