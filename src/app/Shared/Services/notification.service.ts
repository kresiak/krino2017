import { Injectable, Inject } from '@angular/core'
import { ApiService } from 'gg-basic-data-services'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { OrderService } from './order.service'
import { OtpService } from './otp.service'
import { StockService } from './stock.service'
import { VoucherService } from './voucher.service'
import { ProductService } from './product.service'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import * as utilsDate from './../Utils/dates'

import { ModalConfirmComponent } from './../../ui/modal/modal-confirm.component'


Injectable()
export class NotificationService {

    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService, @Inject(ApiService) private apiService: ApiService,
        @Inject(OrderService) private orderService: OrderService, @Inject(OtpService) private otpService: OtpService,
        @Inject(StockService) private stockService: StockService, @Inject(VoucherService) private voucherService: VoucherService,
        @Inject(ProductService) private productService: ProductService, @Inject(NgbModal) private modalService: NgbModal) {

    }

    // orders LM warning
    // ==================

    getLmWarningMessages(): Observable<any> {
        return Observable.combineLatest(this.orderService.getAnnotatedFridgeOrders(), this.stockService.getAnnotatedStockOrdersAll(),
            this.voucherService.getOpenRequestedVouchers(), this.voucherService.getAnnotatedUsedVouchersReadyForSap(),
            this.getAnnotatedRecentLogs(24), this.getAdminMonitorForCurrentUser(), this.orderService.getAnnotedOrdersByStatus('Received by SAP'), this.orderService.getAnnotedOrdersValidable(),
            this.otpService.getAnnotatedFinishingOtps(), this.productService.getAnnotatedProductsOnValidationWait(),
            (annotatedFridgeOrders, annotatedStockOrders, openRequestVouchers, usedVouchers, logs, adminConfig, classicOrders, validableOrders, finishingOtps, productsOnValidationWait) => {
                let annotatedFridgeOrdersOk = annotatedFridgeOrders.filter(o => !o.data.isDelivered)
                let annotatedStockOrdersOk = annotatedStockOrders.filter(o => !o.data.isProcessed)

                return {
                    nbTotal: annotatedFridgeOrdersOk.length + annotatedStockOrdersOk.length + openRequestVouchers.length + usedVouchers.length + classicOrders.length + validableOrders.length + productsOnValidationWait.length,
                    fridgeOrders: annotatedFridgeOrdersOk,
                    stockOrders: annotatedStockOrdersOk,
                    requestVouchers: openRequestVouchers,
                    usedVouchers: usedVouchers,
                    classicOrders: classicOrders,
                    validableOrders: validableOrders,
                    finishingOtps: finishingOtps,
                    productsOnValidationWait: productsOnValidationWait,
                    equipeMonitors: logs.filter(log => log.data.type === 'equipe' && adminConfig.equipe.ids.includes(log.data.id) && log.data.amount > adminConfig.equipe.amount),
                    otpMonitors: logs.filter(log => log.data.type === 'otp' && adminConfig.otp.ids.includes(log.data.id) && log.data.amount > adminConfig.otp.amount),
                    userMonitors: logs.filter(log => log.data.type === 'user' && adminConfig.user.ids.includes(log.data.id) && log.data.amount > adminConfig.user.amount),
                    categoryMonitors: logs.filter(log => log.data.type === 'category' && adminConfig.category.ids.includes(log.data.id) && log.data.amount > adminConfig.category.amount)
                }
            });
    }

    getAdminMonitorForCurrentUser() {
        return Observable.combineLatest(this.dataStore.getDataObservable('admin.monitor'), this.authService.getUserIdObservable(), (monitorConfigs, currentUserId) => {
            return monitorConfigs.filter(c => c.userId === currentUserId)[0] || {
                userId: currentUserId,
                otp: {
                    ids: [],
                    amount: 1000
                },
                equipe: {
                    ids: [],
                    amount: 1000
                },
                user: {
                    ids: [],
                    amount: 1000
                },
                category: {
                    ids: [],
                    amount: 1000
                }
            }
        })
    }


    private getAnnotatedRecentLogs(nbHours: number): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('orders.log'), this.dataStore.getDataObservable('users.krino'), this.dataStore.getDataObservable('equipes'),
            this.dataStore.getDataObservable('otps'), this.dataStore.getDataObservable('categories'), (logs, users, equipes, otps, categories) => {
                let now = moment()
                let relevantLogs = logs.filter(log => {
                    let date = utilsDate.getMomentDateFromFormated(log.createDate)
                    let diff = now.diff(date, 'hours')
                    return diff <= nbHours
                })

                return relevantLogs.map(log => {
                    var info: string = ''
                    switch (log.type) {
                        case 'otp':
                            let otp = otps.filter(otp => otp._id === log.id)[0]
                            info = otp ? otp.name : 'unknown otp'
                            break
                        case 'user':
                            let user = users.filter(user => user._id === log.id)[0]
                            info = user ? user.firstName + ' ' + user.name : 'unknown user'
                            break
                        case 'equipe':
                            let equipe = equipes.filter(equipe => equipe._id === log.id)[0]
                            info = equipe ? equipe.name : 'unknown equipe'
                            break
                        case 'category':
                            let category = categories.filter(category => category._id === log.id)[0]
                            info = category ? category.name : 'unknown category'
                            break
                    }

                    return {
                        'data': log,
                        'annotation': {
                            info: info
                        }
                    }
                }).sort(utilsDate.getSortFn(x => x.data.createDate));

            })
        //return this.dataStore.getDataObservable('orders.log')
    }


    getAnnotatedReceptions(): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('suppliers'), this.dataStore.getDataObservable('orders.reception'),
            (suppliers, receptions) => {
                return receptions.map(reception => {
                    let supplier = suppliers.filter(supplier => supplier._id === reception.supplierId)[0]
                    return {
                        data: reception,
                        annotation: {
                            supplier: supplier ? supplier.name : reception.supplier
                        }
                    }
                }).sort(utilsDate.getSortFn(x => x.data.createDate));
            }
        );
    }


    // messages
    // ==============

    private createAnnotatedMessage(message, annotatedUsers) {
        if (!message) return null;

        let user = annotatedUsers.filter(user => user.data._id === message.userId)[0]

        return {
            data: message,
            annotation:
            {
                user: user ? user.annotation.fullName : 'unknown user'
            }
        };
    }

    getAnnotatedMessages(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('messages'),
            this.authService.getAnnotatedUsers(),
            (messages, annotatedUsers) => {
                return messages.filter(message => !message.isPrivate).map(message => this.createAnnotatedMessage(message, annotatedUsers)).sort(utilsDate.getSortFn(x => x.data.createDate));
            });
    }

    getUnreadPrivateMessages(userId): Observable<any> {
        return this.dataStore.getDataObservable('messages').map(messages => messages.filter(m => m.isPrivate && m.toUserId === userId && !m.isRead))
    }

    getUnreadPrivateAnnotatedMessages(userId): Observable<any> {
        return Observable.combineLatest(this.getUnreadPrivateMessages(userId), this.authService.getAnnotatedUsersHashmap(), (messages: any[], userMap) => {
            messages.forEach(m => m.userSendingFullName = userMap.has(m.userId) ? userMap.get(m.userId).annotation.fullName : 'unknown user')
            return messages
        })
    }


    getSortedUnreadPrivateMessages(userId): Observable<any> {
        return this.getUnreadPrivateAnnotatedMessages(userId).map(messages => messages.sort(utilsDate.getSortFn(x => x.createDate)))
    }

    getNbPrivateMessages(userId): Observable<number> {
        return this.getUnreadPrivateMessages(userId).map(messages => messages.length)
    }

    getPrivateMessagesAboutObject(userId, objectId): Observable<any> {
        return this.getUnreadPrivateMessages(userId).map(messages => messages.filter(m => m.id === objectId))
    }

    getNbPrivateMessagesAboutObject(userId, objectId): Observable<number> {
        return this.getPrivateMessagesAboutObject(userId, objectId).map(messages => messages.length)
    }

    sendPrivateObjectMessage(toUserId, objectType: string, objectId: string, messageKey: string) {
        this.authService.getStatusObservable().first().subscribe(statusInfo => {
            if (statusInfo.currentUserId === toUserId) return   // don't send to myself
            var data = {
                isPrivate: true,
                isRead: false,
                userId: statusInfo.currentUserId,
                toUserId: toUserId,
                objectType: objectType,
                id: objectId,
                message: messageKey
            }
            this.dataStore.addData('messages', data)
        })
    }

    // utilities
    // =========

    checkForConfirmation(explicationKey: string = undefined, fnCloseAction = undefined) {
        var modalRef = this.modalService.open(ModalConfirmComponent)
        if (explicationKey)
            modalRef.componentInstance.explicationKey = explicationKey
        if (fnCloseAction)
            modalRef.componentInstance.fnCloseAction = fnCloseAction
    }

    mailTo(to: string, subject: string, html: string) {
        this.apiService.callWebService('ggMailTo', {
            data: {
                to: to,
                subject: subject,
                html: html
            }
        }).first().subscribe(res => {
            
        })
    }
}
