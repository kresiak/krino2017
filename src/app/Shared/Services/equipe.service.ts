import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { UserService } from './user.service'
import { OtpService } from './otp.service'
import { SapService } from './sap.service'
import { SelectableData } from 'gg-basic-code'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import {utilsObservables as utils} from 'gg-basic-code'


@Injectable()
export class EquipeService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService, @Inject(UserService) private userService: UserService,
        @Inject(SapService) private sapService: SapService, @Inject(OtpService) private otpService: OtpService) { }


    private getTotalOfOrder(order): number {
        return order.items && order.items.length > 0 ? order.items.map(item => item.total).reduce((a, b) => a + b) : 0;
    }

    private getTotalOfOrders(orders): number {
        return orders.length === 0 ? 0 : orders.map(order => this.getTotalOfOrder(order)).reduce((a, b) => a + b);
    }

    private getTotalOfVoucherOrders(orders): number {
        return orders.length === 0 ? 0 : orders.filter(order => order.shopping).map(order => +order.shopping.total).reduce((a, b) => a + b, 0);
    }

    private getTotalOfFridgeOrders(orders, products): number {
        return orders.length === 0 ? 0 : orders.filter(order => order.isDelivered).map(order => {
            let product = products.filter(p => p._id === order.productId)[0]
            return product ? +product.price * order.quantity : 0
        }).reduce((a, b) => a + b, 0);
    }

    private getTotalOfStockOrders(orders, products, stockItems): number {
        return orders.length === 0 ? 0 : orders.filter(order => order.isProcessed && order.stockItemIds).map(order => {
            let product = products.filter(p => p._id === order.productId)[0]
            let stockItem = stockItems.filter(item => item._id === order.stockItemIds[0])[0]
            return product && stockItem ? (+product.price / +stockItem.divisionFactor) * +order.quantity : 0
        }).reduce((a, b) => a + b, 0);
    }


    // equipes
    // =======

    private createBilanForEquipe(equipeId, orders: any[], ordersFridge: any[], ordersStock: any[], ordersVoucher: any[], products: any[], stockItems: any[]) {
        let ordersFiltered = orders.filter(order => order.equipeId === equipeId);
        let ordersFridgeFiltered = ordersFridge.filter(order => order.equipeId === equipeId);
        let ordersStockFiltered = ordersStock.filter(order => order.equipeId === equipeId);
        let ordersVoucherFiltered = ordersVoucher.filter(order => order.shopping && order.shopping.equipeId === equipeId);

        return {
            totalOrders: this.getTotalOfOrders(ordersFiltered),
            totalFridgeOrders: this.getTotalOfFridgeOrders(ordersFridgeFiltered, products),
            totalVoucherOrders: this.getTotalOfVoucherOrders(ordersVoucherFiltered),
            totalStockOrders: this.getTotalOfStockOrders(ordersStockFiltered, products, stockItems)
        }
    }

    getBilanForEquipe(equipeId) {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('orders'),
            this.dataStore.getDataObservable('orders.fridge'),
            this.dataStore.getDataObservable('orders.stock'),
            this.dataStore.getDataObservable('orders.vouchers'),
            this.dataStore.getDataObservable('products'),
            this.dataStore.getDataObservable('products.stock'),
            (orders: any[], ordersFridge: any[], ordersStock: any[], ordersVoucher: any[], products: any[], stockItems: any[]) => {
                return this.createBilanForEquipe(equipeId, orders, ordersFridge, ordersStock, ordersVoucher, products, stockItems)
            });
    }

    private createAnnotatedEquipe(equipe, equipeGiftsAnnotated, orders: any[], otps: any[], dashlets: any[], equipeMutualDebtMap: Map<string, any>, equipeMap: Map<string, any>, otpAnnotatedMap: Map<string, any>) {
        if (!equipe) return null;

        var debts = equipeMutualDebtMap.get(equipe._id)

        var owed= debts ? debts.owed : 0
        var owing= debts ? debts.owing : 0

        var receivedGifts= equipeGiftsAnnotated.filter(gift => gift.data.equipeTakingId === equipe._id)
        var givenGifts= equipeGiftsAnnotated.filter(gift => gift.data.equipeGivingId === equipe._id)
        var receivedGiftsAmount= receivedGifts.reduce((acc, gift) => acc + +gift.data.amount, 0)
        var givenGiftsAmount= givenGifts.reduce((acc, gift) => acc + +gift.data.amount, 0)

        let ordersFiltered = orders.filter(order => order.equipeId === equipe._id);
        let otpsFiltered = otps.filter(otp => otp.data.equipeId === equipe._id);
        let budget = otpsFiltered && otpsFiltered.length > 0 ? otpsFiltered.map(otp => otp.annotation.budget).reduce((a, b) => a + b) : 0;
        let amountAvailable = (otpsFiltered && otpsFiltered.length > 0 ? otpsFiltered.map(otp => otp.annotation.amountAvailable).reduce((a, b) => a + b) : 0) + owed - owing;
        let amountSpent = budget - amountAvailable
        amountAvailable+= receivedGiftsAmount - givenGiftsAmount
        let dashlet = dashlets.filter(dashlet => dashlet.id === equipe._id);

        function annotateDetails(details: any[]) {
            return details.map(item => {
                return {
                    data: item,
                    annotation: {
                        otp: otpAnnotatedMap.get(item.otpId).data.name,
                        equipe: equipeMap.get(item.equipeId).name
                    }
                }
            })
        }

        return {
            data: equipe,
            annotation:
            {
                amountSpent: amountSpent,
                budget: budget,
                owed: owed,
                owing: owing,
                amountAvailable: amountAvailable, // budget - amountSpent,
                receivedGiftsAmount: receivedGiftsAmount,
                givenGiftsAmount: givenGiftsAmount,
                dashletId: dashlet.length > 0 ? dashlet[0]._id : undefined,
                owedDetails: debts ? annotateDetails(debts.owedDetails) : [],
                owingDetails: debts ? annotateDetails(debts.owingDetails) : [],
                receivedGifts: receivedGifts,
                givenGifts: givenGifts
            }
        };
    }

    getAnnotatedEquipes(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('equipes'),
            this.getAnnotatedEquipesGifts(),
            this.dataStore.getDataObservable('orders'),
            this.otpService.getAnnotatedOtps(),
            this.userService.getEquipeDashletsForCurrentUser(),
            this.getEquipeMutualDebtMap(),

            (equipes, equipeGifts, orders, otps, dashlets, equipeMutualDebtMap) => {
                var equipeMap= utils.hashMapFactory(equipes)
                var otpAnnotatedMap= utils.hashMapFactoryForAnnotated(otps)
                return equipes.map(equipe => this.createAnnotatedEquipe(equipe, equipeGifts, orders, otps, dashlets, equipeMutualDebtMap, equipeMap, otpAnnotatedMap))
            });
    }

    getAnnotatedEquipeById(equipeId): Observable<any> {
        return this.getAnnotatedEquipes().map(equipes => {
            let equipesFiltered = equipes.filter(equipe => equipe.data._id === equipeId);
            return equipesFiltered.length === 0 ? null : equipesFiltered[0];
        });
    }

    getAnnotatedCurrentEquipe(): Observable<any> {
        return this.getAnnotatedEquipes().map(equipes => equipes.filter(eq => eq.data._id === this.authService.getEquipeId())[0])
    }


    private getAnnotatedEquipesOfCurrentUser(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedEquipes(), this.authService.getUserIdObservable(), (equipes, userId) => {
            return equipes.filter(equipe =>
                equipe.data.userIds && equipe.data.userIds.includes(userId));
        });
    }

    getAnnotatedEquipesOfUser(userId: string): Observable<any> {
        return this.getAnnotatedEquipes().map(equipes => equipes.filter(eq => eq.data.userIds && eq.data.userIds.includes(userId)));
    }


    getSelectableEquipes(): Observable<SelectableData[]> {
        return this.dataStore.getDataObservable('equipes').map(equipes => {
            return equipes.map(equipe =>
                new SelectableData(equipe._id, equipe.name)
            )
        });
    }

    getEquipesForAutocomplete() {
        return this.dataStore.getDataObservable('equipes').map(equipes => equipes.map(eq => {
            return {
                id: eq._id,
                name: eq.name
            }
        }));
    }


    // equipes groups
    // ==============

    private createAnnotatedEquipeGroup(group, equipes) {
        if (!group) return null;
        let weightSum = group.equipeIds.reduce((acc, idObj) => acc + idObj.weight, 0)

        return {
            data: group,
            annotation:
            {
                equipesTxt: group.equipeIds.reduce((acc, idObj) => {
                    let equipe = equipes.filter(eq => eq._id === idObj.id)[0]
                    if (equipe) acc = acc + (acc === '' ? '' : ', ') + equipe.name
                    return acc
                }, ''),
                equipes: group.equipeIds.map(idObj => {
                    let equipe = equipes.filter(eq => eq._id === idObj.id)[0]
                    return {
                        data: idObj,
                        annotation: {
                            equipe: equipe ? equipe.name : 'unknown equipe',
                            pc: idObj.weight / weightSum * 100
                        }
                    }
                })
            }
        };
    }

    getAnnotatedEquipesGroups(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('equipes'),
            this.dataStore.getDataObservable('equipes.groups'),
            (equipes, groups) => {
                return groups.map(group => this.createAnnotatedEquipeGroup(group, equipes))
            });
    }


    // equipes gifts
    // ==============

    private createAnnotatedEquipeGift(gift, equipes, annotatedUsers) {
        if (!gift) return null;

        let equipeGiving = equipes.filter(eq => eq._id === gift.equipeGivingId)[0]
        let equipeTaking = equipes.filter(eq => eq._id === gift.equipeTakingId)[0]
        let user = annotatedUsers.filter(user => user.data._id === gift.userId)[0]

        return {
            data: gift,
            annotation:
            {
                equipeGiving: equipeGiving ? equipeGiving.name : 'unknown equipe',
                equipeTaking: equipeTaking ? equipeTaking.name : 'unknown equipe',
                user: user ? user.annotation.fullName : 'unknown user'
            }
        };
    }

    getAnnotatedEquipesGifts(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('equipes'),
            this.dataStore.getDataObservable('equipes.gifts'),
            this.authService.getAnnotatedUsers(),
            (equipes, gifts, annotatedUsers) => {
                return gifts.map(gift => this.createAnnotatedEquipeGift(gift, equipes, annotatedUsers))
            });
    }

    // equipes budget
    // ==============

    private annotatedEquipesMutualDebts: ConnectableObservable<any>;

    private getEquipeMutualDebtMap(): Observable<any> {
        if (this.annotatedEquipesMutualDebts) return this.annotatedEquipesMutualDebts

        function createEmptyRecord(equipesMap, equipeId) {
            equipesMap.set(equipeId, {
                owing: 0,
                owed: 0,
                owingDetails: [],
                owedDetails: []
            })
        }

        function isOtpFromDifferentEquipe(otpsMap, otpId, equipeId) {
            var otp = otpsMap.get(otpId)
            return otp && otp.equipeId && otp.equipeId !== equipeId
        }

        function addDetail(detailsArray, id: number, poste: number, otherEquipeId: string, amount, comment, date, otpId) {
            detailsArray.push({
                id: id,
                poste: poste,
                equipeId: otherEquipeId,
                amount: amount,
                comment: comment,
                date: date,
                otpId: otpId
            })
        }

        function processPoste(equipeId, id, poste, otp, amount, porCent, comment, date, equipesMap) {
            var otherEquipeId = otp.equipeId
            var amountCorrected = amount * porCent / 100
            if (!equipesMap.has(otherEquipeId)) createEmptyRecord(equipesMap, otherEquipeId)

            var equipeRecord = equipesMap.get(equipeId)
            equipeRecord.owing += amountCorrected
            addDetail(equipeRecord.owingDetails, id, poste, otherEquipeId, amountCorrected, comment, date, otp._id)

            var otherEquipeRecord = equipesMap.get(otherEquipeId)
            otherEquipeRecord.owed += amountCorrected
            addDetail(otherEquipeRecord.owedDetails, id, poste, equipeId, amountCorrected, comment, date, otp._id)
        }


        function processSapItem(sapItem, equipeId, porCent, equipesMap: Map<string, any>, otpsMapByName: Map<string, any>) {
            function getOtp(otpName) {
                return otpsMapByName.get(otpName)
            }

            if (!equipesMap.has(equipeId)) createEmptyRecord(equipesMap, equipeId);

            (sapItem.postList || []).filter(poste => poste.residuEngaged > 0).forEach(poste => {
                if (isOtpFromDifferentEquipe(otpsMapByName, poste.otp, equipeId)) {
                    processPoste(equipeId, sapItem.sapId, poste.poste, getOtp(poste.otp), poste.amountResiduel, porCent, 'engaged', undefined, equipesMap)
                }
            })

            if (sapItem.factured && sapItem.factured.data) {
                (sapItem.factured.data.items || []).filter(poste => !poste.isBlocked && !poste.isSuppr).forEach(poste => {
                    if (isOtpFromDifferentEquipe(otpsMapByName, poste.otp, equipeId)) {
                        processPoste(equipeId, sapItem.sapId, poste.poste, getOtp(poste.otp), poste.tvac, porCent, 'invoiced', poste.dateComptable, equipesMap)
                    }
                })
            }
        }

        function processOrder(order, equipeId, porCent, equipesMap: Map<string, any>, otpsMap: Map<string, any>) {
            function getOtp(otpId) {
                return otpsMap.get(otpId)
            }

            if (!equipesMap.has(equipeId)) createEmptyRecord(equipesMap, equipeId);

            (order.items || []).filter(poste => true).forEach((poste, index) => {
                if (isOtpFromDifferentEquipe(otpsMap, poste.otpId, equipeId)) {
                    processPoste(equipeId, order.kid, index, getOtp(poste.otpId), poste.total, porCent, 'ordered', order.date, equipesMap)
                }
            })
        }


        this.annotatedEquipesMutualDebts = Observable.combineLatest(
            this.dataStore.getDataObservable('sap.fusion'),
            this.dataStore.getDataObservable('sap.krino.annotations').map(utils.hashMapFactoryCurry(a => a.sapId)),
            this.dataStore.getDataObservable('orders'),
            this.dataStore.getDataObservable('orders').map(utils.hashMapFactoryCurry(a => a.kid)),
            this.dataStore.getDataObservable('equipes'),
            this.dataStore.getDataObservable('otps').map(utils.hashMapFactoryCurry(otp => otp._id)),
            this.dataStore.getDataObservable('otps').map(utils.hashMapFactoryCurry(otp => otp.name)),
            this.sapService.getKrinoIdMapObservable(),
            this.dataStore.getDataObservable('orders.vouchers').map(vouchers => vouchers.filter(v => v.shopping && v.shopping.equipeId)).map(utils.hashMapFactoryCurry(voucher => +voucher.sapId)),
            (sapItems, sapAnnotationsMap: Map<number, any>, orders, ordersMap: Map<number, any>, equipes, otpsMap: Map<string, any>, otpsMapByName: Map<string, any>, krinoSapMap, voucherMap) => {
                var equipesMap: Map<string, any> = new Map<string, any>()
                sapItems.filter(item => sapAnnotationsMap.has(item.sapId)).forEach(item => {
                    var equipeId = sapAnnotationsMap.get(item.sapId).equipeId
                    processSapItem(item, equipeId, 100, equipesMap, otpsMapByName)
                })
                sapItems.filter(item => voucherMap.has(item.sapId)).forEach(item => {
                    var equipeId = voucherMap.get(item.sapId).shopping.equipeId
                    processSapItem(item, equipeId, 100, equipesMap, otpsMapByName)
                })
                sapItems.filter(item => item.mainData && item.mainData.data && +item.mainData.data.ourRef && ordersMap.has(+item.mainData.data.ourRef)).forEach(item => {
                    var equipeId = ordersMap.get(+item.mainData.data.ourRef).equipeId
                    var equipeRepartition = ordersMap.get(+item.mainData.data.ourRef).equipeRepartition
                    if (equipeId) {
                        processSapItem(item, equipeId, 100, equipesMap, otpsMapByName)
                    }
                    else if (equipeRepartition) {
                        equipeRepartition.repartition.forEach(repartitionItem => processSapItem(item, repartitionItem.equipeId, repartitionItem.weight, equipesMap, otpsMapByName))
                    }
                })
                orders.filter(order => !krinoSapMap.has(order.kid) && order.status.value !== 'deleted').forEach(order => {
                    var equipeId = order.equipeId
                    var equipeRepartition = order.equipeRepartition
                    if (equipeId) {
                        processOrder(order, order.equipeId, 100, equipesMap, otpsMap)
                    }
                    else if (equipeRepartition) {
                        equipeRepartition.repartition.forEach(repartitionItem => processOrder(order, repartitionItem.equipeId, repartitionItem.weight, equipesMap, otpsMap))
                    }                    
                })
                return equipesMap
            }).publishReplay(1)

        this.annotatedEquipesMutualDebts.connect()

        return this.annotatedEquipesMutualDebts
    }



}