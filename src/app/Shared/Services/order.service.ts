import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { AdminService } from './admin.service'
import { UserService } from './user.service'
import { SapService } from './sap.service'
import { SelectableData } from './../Classes/selectable-data'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import * as utils from './../Utils/observables'
import * as utilsDate from './../Utils/dates'


Injectable()
export class OrderService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService, @Inject(UserService) private userService: UserService,
        @Inject(SapService) private sapService: SapService, @Inject(AdminService) private adminService: AdminService) { }




    getOrderEquipeInfoMap(): Observable<Map<number, any>> {
        var x = Observable.combineLatest(this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.kid)),
            this.dataStore.getDataObservable('equipes').map(utils.hashMapFactory), this.dataStore.getDataObservable('equipes.groups').map(utils.hashMapFactory),
            (orders, equipesMap, equipesGroupMap) => {
                return orders.map(order => {
                    let equipe = order.equipeId ? equipesMap.get(order.equipeId) : undefined
                    let equipeGroup = order.equipeRepartition ? equipesGroupMap.get(order.equipeRepartition.equipeGroupId) : undefined
                    return {
                        data: order,
                        annotation: {
                            equipe: equipe ? equipe.name : null,
                            equipeGroup: equipeGroup ? equipeGroup.name : null,
                            equipeGroupRepartition: equipeGroup ? order.equipeRepartition.repartition.reduce((acc, repItem) => {
                                if (acc) acc += ', '
                                var eq = equipesMap.get(repItem.equipeId)
                                acc += (eq ? eq.name : 'unknown equipe') + ': ' + repItem.weight + '%'
                                return acc
                            }, '') : null
                        }
                    }
                })

            }).map(utils.hashMapFactoryCurry(element => element.data.kid)).publishReplay(1)
        x.connect()

        return x
    }



    // orders
    // ======

    // order helper functions for viewing orders
    // =========================================


    private getTotalOfOrder(order): number {
        return order.items && order.items.length > 0 ? order.items.map(item => item.total).reduce((a, b) => a + b) : 0;
    }

    private getTotalOfOrders(orders): number {
        return orders.length === 0 ? 0 : orders.map(order => this.getTotalOfOrder(order)).reduce((a, b) => a + b);
    }


    private mapOldKrinoStatus(id: number) {
        var map = {
            1: 'Ready',
            2: 'Blocked',
            3: 'Deleted',
            4: 'Received by SAP',
            5: 'Sent to supplier',
            6: 'Partially delivered',
            7: 'Fully delivered',
            9: 'Inconnu',
            10: 'Invoiced',
            15: 'Synchronisé avec SAP',
            33: 'Commanmde interne',
            34: 'Commande Bernadette',
            40: 'Remboursement',
            50: 'Commande au LM',
            60: 'Commande Oligo prête',
            70: 'Sequencing',
            80: 'Frigo -2',
            81: 'Frigo -2 delivered',
            82: 'Engagement sur commande ouverte',
            90: 'Pièce sans engagement'
        }
        if (map[id]) return map[id]
        return 'Unknown status'
    }



    private createAnnotedOrder(order, products, otps, annotatedUsers, equipes, groups, suppliers, dashlets: any[], currentUser, krinoSapMap, labo, currencies, sapEngMaps) {
        if (!order) return null;
        let supplier = suppliers.get(order.supplierId)
        let equipe = equipes.get(order.equipeId)
        let equipeGroup = !order.equipeRepartition ? null : groups.get(order.equipeRepartition.equipeGroupId)
        let annotatedUser = annotatedUsers.get(order.userId)
        let dashlet = dashlets.filter(dashlet => dashlet.id === order._id);
        let status = order.status && order.status.value ? order.status.value : (order.oldKrino && order.oldKrino.status ? this.mapOldKrinoStatus(order.oldKrino.status) : '?')

        var getSapIdFromMap= (id) => {
            if (!sapEngMaps) {
                return undefined
            }
            var x= sapEngMaps.filter(e => +e.ourRef===id)[0]
            return x ? x.sapId : undefined
        }

        let retObj = {
            data: order,
            annotation: {
                sapError: (() => {
                    if (!order.sapFeedback || !order.sapFeedback.error) return []
                    return order.sapFeedback.file.filter(line => line.startsWith('E') || line.match(/^\d{5,}/) )
                })(),
                sapId: krinoSapMap.get(order.kid) || getSapIdFromMap(order.kid),
                user: annotatedUser ? annotatedUser.annotation.fullName : 'Unknown user',
                userPicture: annotatedUser ? annotatedUser.data.pictureFile : undefined,
                supplier: supplier ? supplier.name : 'Unknown supllier',
                status: status,
                isGroupedOrder: annotatedUser && this.authService.isUserGroupOrderUser(annotatedUser.data._id),
                isDeletable: status === 'created' && currentUser && (order.userId === currentUser.data._id || currentUser.data.isAdmin),
                needsValidation: status === 'created' && order.pendingValidation,
                validationStatus: status === 'created' && order.pendingValidation ? this.adminService.getValidationStepDescription(order.pendingValidation) : '',
                canCurrentUserValidate: currentUser && status === 'created' && order.pendingValidation && this.adminService.canUserValidateStep(currentUser, labo, order.pendingValidation, order.equipeId),
                //equipe: equipe ? equipe.name : 'Unknown equipe',
                total: this.getTotalOfOrder(order),
                dashletId: dashlet.length > 0 ? dashlet[0]._id : undefined,
                items: !order.items ? [] : order.items.map(item => {
                    let product = products.get(item.productId)
                    let currency= (!product || ! product.currencyId) ? 'EUR' : (currencies.filter(c => c._id === product.currencyId)[0] || {'name': '???'}).name
                    let exchangeRate: number= (!product || ! product.currencyId) ? 1 : (currencies.filter(c => c._id === product.currencyId)[0] || {'conversionToEuro': 1}).conversionToEuro

                    let otp = otps.get(item.otpId)
                    let nbDelivered = (item.deliveries || []).reduce((acc, delivery) => acc + (+delivery.quantity), 0)
                    return {
                        data: item,
                        annotation: {
                            otp: otp ? otp.name : 'Unknown otp',
                            description: product ? product.name + (product.package ? ' / ' + product.package : '') : 'Unknown product',
                            currency: currency,
                            exchangeRate: exchangeRate,
                            tva: product ? (product.tva || 21) : 21,
                            catalogNr: product && product.catalogNr ? product.catalogNr : 'No catalogNr',
                            isStockProduct: product && product.isStock,
                            needsLotNumber: product && product.needsLotNumber,
                            stockDivisionFactor: (product && +product.divisionFactor && (+product.divisionFactor) > 0) ? +product.divisionFactor : 1,
                            stockPackaging: (product && product.stockPackage && product.stockPackage !== '') ? product.stockPackage : (product ? product.package + ' divided by ' + product.divisionFactor : ''),
                            price: product ? product.price : '0',
                            nbDelivered: nbDelivered,
                            allDelivered: item.quantity === nbDelivered,
                            anyDelivered: item.quantity !== 0 && nbDelivered != 0,
                            deliveries: (item.deliveries || []).map(delivery => {
                                let userLm = annotatedUsers.get(delivery.userId)
                                return {
                                    data: delivery,
                                    annotation: {
                                        userLm: userLm ? userLm.annotation.fullName : 'Unknown user',
                                        isStock: delivery.stockId
                                    }
                                }
                            }),
                            detail: (item.detail || []).map(detailItem => {
                                let user = annotatedUsers.get(detailItem.userId)
                                let eq = equipes.get(detailItem.equipeId)
                                return {
                                    data: detailItem,
                                    annotation: {
                                        userFullName: user ? user.annotation.fullName : 'Unknown user',
                                        equipe: eq ? eq.name : 'Unknown equipe'
                                    }
                                }
                            })
                        }
                    }
                })
            }
        };

        retObj.annotation['anyDeliveredByNewKrino'] = retObj.annotation.items.filter(item => item.annotation.anyDelivered).length > 0
        retObj.annotation['anyDelivered'] = (order.oldKrino && order.oldKrino.status === 6) || (retObj.annotation.items.filter(item => item.annotation.anyDelivered).length > 0)
        retObj.annotation['allDelivered'] = (order.oldKrino && order.oldKrino.status === 7) || (retObj.annotation.items.filter(item => !item.annotation.allDelivered).length === 0)

        if (equipe) retObj.annotation['equipe'] = equipe.name
        if (equipeGroup) {
            retObj.annotation['equipeGroup'] = equipeGroup.name
            retObj.annotation['equipes'] = order.equipeRepartition.repartition.map(item => {
                let equipe = equipes.get(item.equipeId)
                return {
                    weight: item.weight,
                    equipe: equipe ? equipe.name : 'unknown equipe'
                }
            })
        }

        return retObj
    }

    // viewing orders
    // ==============

    getAnnotedOrder(id: string): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order._id === id || order.kid === +id)[0]),
            this.dataStore.getDataObservable('products').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('otps').map(utils.hashMapFactory),
            this.authService.getAnnotatedUsersHashmap(),
            this.dataStore.getDataObservable('equipes').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('equipes.groups').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('suppliers').map(utils.hashMapFactory),
            this.userService.getOrderDashletsForCurrentUser(),
            this.authService.getAnnotatedCurrentUser(),
            this.sapService.getKrinoIdMapObservable(),
            this.adminService.getLabo(),
            this.dataStore.getDataObservable('currencies'),
            this.dataStore.getDataObservable('sap.engage.map'),
            (order, products, otps, users, equipes, groups, suppliers, dashlets, currentUser, krinoSapMap, labo, currencies, sapEngMaps) => {
                return this.createAnnotedOrder(order, products, otps, users, equipes, groups, suppliers, dashlets, currentUser, krinoSapMap, labo, currencies, sapEngMaps);
            })
    }


    private getAnnotedOrders(ordersObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(
            ordersObservable,
            this.dataStore.getDataObservable('products').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('otps').map(utils.hashMapFactory),
            this.authService.getAnnotatedUsersHashmap(),
            this.dataStore.getDataObservable('equipes').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('equipes.groups').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('suppliers').map(utils.hashMapFactory),
            this.userService.getOrderDashletsForCurrentUser(),
            this.authService.getAnnotatedCurrentUser(),
            this.sapService.getKrinoIdMapObservable(),
            this.adminService.getLabo(),
            this.dataStore.getDataObservable('currencies'),
            this.dataStore.getDataObservable('sap.engage.map'),
            (orders, products, otps, users, equipes, groups, suppliers, dashlets, currentUser, krinoSapMap, labo, currencies, sapEngMaps) => {
                return orders.map(order =>
                    this.createAnnotedOrder(order, products, otps, users, equipes, groups, suppliers, dashlets, currentUser, krinoSapMap, labo, currencies, sapEngMaps)
                );
            })
    }

    getAnnotedOrdersFromAll(): Observable<any> {
        return this.getAnnotedOrders(this.dataStore.getDataObservable('orders'));
    }

    getAnnotedOrdersWithStockDeliveries(): Observable<any> {
        return this.getAnnotedOrdersFromAll().map(orders => orders.filter(order => order.annotation.anyDeliveredByNewKrino));
    }

    getAnnotedOrdersValidable(): Observable<any> {
        return this.getAnnotedOrdersFromAll().map(orders => orders.filter(order => order.annotation.canCurrentUserValidate));
    }


    getNewestAnnotedOrders(nb: number): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.sort((a, b) => b.kid - a.kid).slice(0, nb))
        return this.getAnnotedOrders(ordersObservable);
    }

    getAnnotedOrdersByNewest(): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }

    getAnnotedOrdersBySupplier(supplierId: string): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.supplierId === supplierId)).map(orders => orders.sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }

    getAnnotedUsersBySupplier(supplierId: string): Observable<any> {
        return this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.supplierId === supplierId))
            .switchMap(orders => {
                var userIdList= orders.reduce((acc: Set<string>, o) => {
                    if (!acc.has(o.userId)) acc.add(o.userId)
                    return acc
                }, new Set<string>())
                return this.authService.getAnnotatedUsers().map(users => users.filter(u => userIdList.has(u.data._id)))
            })
    }

    getAnnotedOrdersByProduct(productId: string): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.items && order.items.map(item => item.productId).includes(productId))).map(orders => orders.sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }

    hasSupplierAnyOrder(supplierId: string): Observable<boolean> {
        return this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.supplierId === supplierId).length > 0)
    }

    getAnnotedOrdersByEquipe(equipeId: string): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.equipeId === equipeId).sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }

    getAnnotedOrdersByStatus(status: string): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.status && order.status.value === status).sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }


    getAnnotedOrdersByUser(userId: string): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.userId === userId).sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }

    hasEquipeAnyOrder(equipeId: string): Observable<boolean> {
        return this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.equipeId === equipeId).length > 0);
    }

    getAnnotedOrdersOfCurrentUser(): Observable<any> {
        return this.authService.getUserIdObservable().switchMap(userId => {
            let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.userId === userId).sort((a, b) => b.kid - a.kid))
            return this.getAnnotedOrders(ordersObservable);
        })
    }

    getAnnotedOrdersByOtp(otpId: string): Observable<any> {
        let ordersObservable = this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.items && order.items.map(item => item.otpId).includes(otpId)).sort((a, b) => b.kid - a.kid))
        return this.getAnnotedOrders(ordersObservable);
    }

    hasOtpAnyOrder(otpId: string): Observable<boolean> {
        return this.dataStore.getDataObservable('orders').map(orders => orders.filter(order => order.items && order.items.map(item => item.otpId).includes(otpId)).length > 0);
    }


    // light methods
    // ==============

    getKrinoIdLightMap() {
        return this.dataStore.getDataObservable('orders').map(orders => orders.map(order => { return { _id: order._id, kid: order.kid } })).map(utils.hashMapFactory)
    }

    // e-proc orders
    // ==============

    public getAnnotedEprocOrders(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('orders.eproc'),
            this.authService.getAnnotatedUsers().map(utils.hashMapFactoryForAnnotated),
            this.dataStore.getDataObservable('equipes').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('suppliers').map(utils.hashMapFactory),
            (orders, users, equipes, suppliers) => {
                return orders.map(order => {
                    return {
                        data: order,
                        annotation: {
                            user: users.has(order.userId) ? users.get(order.userId).annotation.fullName : 'unknown user',
                            equipe: equipes.has(order.equipeId) ? equipes.get(order.equipeId).name : 'unknown equipe',
                            supplier: suppliers.has(order.supplierId) ? suppliers.get(order.supplierId).name : 'unknown supplier'
                        }
                    }
                }
                ).sort(utilsDate.getSortFn(x => x.data.createDate));
            })
    }


    // fridge orders
    // ==============

    private createAnnotatedFridgeOrder(order, products, equipes, annotatedUsers) {
        if (!order) return null;

        let user = annotatedUsers.filter(user => user.data._id === order.userId)[0]
        let equipe = equipes.filter(eq => eq._id === order.equipeId)[0]
        let product = products.filter(p => p._id === order.productId)[0]

        return {
            data: order,
            annotation:
            {
                user: user ? user.annotation.fullName : 'unknown user',
                equipe: equipe ? equipe.name : 'unknown equipe',
                product: product ? product.name + ' ' + product.package : 'unknown product'
            }
        };
    }

    getAnnotatedFridgeOrders(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('orders.fridge'),
            this.dataStore.getDataObservable('products'),
            this.dataStore.getDataObservable('equipes'),
            this.authService.getAnnotatedUsers(),
            (orders, products, equipes, annotatedUsers) => {
                return orders.map(order => this.createAnnotatedFridgeOrder(order, products, equipes, annotatedUsers)).sort(utilsDate.getSortFn(x => x.data.createDate));
            });
    }

    getAnnotatedFridgeOrdersByUser(userId): Observable<any> {
        return this.getAnnotatedFridgeOrders().map(orders => orders.filter(order => order.data.userId === userId))
    }

    getAnnotatedFridgeOrdersByEquipe(equipeId): Observable<any> {
        return this.getAnnotatedFridgeOrders().map(orders => orders.filter(order => order.data.equipeId === equipeId))
    }

    getAnnotatedFridgeOrdersByCurrentUser(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedFridgeOrders(), this.authService.getUserIdObservable(), (orders, userId) => {
            return orders.filter(order => order.data.userId === userId)
        })
    }



    // sap annotations
    // ===============

    annotateEquipesOnSap() {
        Observable.combineLatest(this.sapService.getSapItemsObservable(), this.getAnnotedOrdersFromAll(), this.dataStore.getDataObservable('sap.annotation').startWith([]),
            (sapItems: any[], orders: any[], annotations: any[]) => {

                var ordersMap = utils.hashMapFactoryForAnnotated(orders)
                var ordersBySapIdMap = utils.hashMapFactoryHelper(orders.filter(order => order.data.sapId), order => order.data.sapId)
                var annotationsMap = utils.hashMapFactoryHelper(annotations, element => element.sapId)

                var krinoStartDate = moment('08/03/2017', 'DD/MM/YYYY').toDate()

                annotations.forEach(annotation => {
                    annotation.processed = false
                })

                sapItems.forEach(sapItem => {
                    var sapId = sapId.mainData.sapId
                    var krinoId = +sapId.mainData.ourRef

                    if (krinoId) {

                    }
                    else {

                    }
                })

                annotations.filter(annotation => !annotation.processed).forEach(annotation => {

                })

            }
        )

    }



}


