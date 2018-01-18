import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'
import { UserService } from './user.service'
import { SapService } from './sap.service'
import { AdminService } from './admin.service'
import { SelectableData } from './../Classes/selectable-data'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import * as utils from './../Utils/observables'
import * as utilsKrino from './../Utils/krino'
import * as utilsDate from './../Utils/dates'


Injectable()
export class OtpService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(UserService) private userService: UserService,
        @Inject(SapService) private sapService: SapService, @Inject(AdminService) private adminService: AdminService) { }

    // otps
    // ======

    getSelectableOtps(): Observable<SelectableData[]> {
        return this.dataStore.getDataObservable('otps').map(otps => {
            return otps.map(otp =>
                new SelectableData(otp._id, otp.name)
            )
        });
    }

    private getOtpMoneySpentMapObservable(): Observable<Map<string, number>> {    // parse the orders in a linear way to create a map otp => money spent    (more performance friendly)
        return Observable.combineLatest(this.dataStore.getDataObservable('orders'), this.sapService.getKrinoIdMapObservable(),
            (orders, krinoSapMap) => {
                return orders.filter(order => !krinoSapMap.has(order.kid) && order.status.value !== 'deleted').reduce((map, order) => {
                    if (order.items) {
                        order.items.filter(item => item.otpId && item.total).forEach(item => {
                            let otpId = item.otpId
                            if (!map.has(otpId)) map.set(otpId, 0)
                            map.set(otpId, map.get(otpId) + item.total)
                        })
                    }
                    return map
                }, new Map())
            })
    }

    private migrationChangeOtp(otp) {
        if (!otp.budgetPeriods) {    // for migration of old otps
            otp.budgetPeriods = [
                {
                    budget: +otp.budget || 0,
                    datStart: otp.datStart || utilsDate.nowFormated(),
                    datEnd: otp.datEnd || utilsDate.nowFormated()
                }
            ]
            delete otp.budget
            delete otp.datStart
            delete otp.datEnd
        }
        return otp
    }

    private getAnnotationsOfBudgetPeriod(p) {
        var changesSum = !p.budgetHistory ? 0 : p.budgetHistory.reduce((acc, item) => acc + item.budgetIncrement, 0)
        var blockedSum = !p.blockedAmounts ? 0 : p.blockedAmounts.reduce((acc, item) => acc + item.amount, 0)
        if (p.creances) 
            var xxx=120
        var creances= !p.creances ? undefined : p.creances.filter(c => utilsDate.isDateAfterNow(c.date)).sort(utilsDate.getSortFn(c => c.date, true))
        return {
            changesSum: changesSum,
            blockedSum: blockedSum,
            budgetTotalAvailable: +p.budget + changesSum - blockedSum,
            budgetAvailable: ((creances && creances.length > 0) ? +(creances[0].amount) : +p.budget) + changesSum - blockedSum,
            datStart: p.datStart,
            datEnd: p.datEnd,
            datNextCreance: (creances && creances.length > 0) ? creances[0].date : undefined 
        }
    }

    private createAnnotatedOtpForBudget(otp, otpSpentMap, sapIdMap, sapOtpMap: Map<string, any>, equipes, dashlets: any[], labo, classifcations) {
        if (!otp) return null;
        if (!otp.priority) otp.priority = 0
        otp.priority = +otp.priority || 0
        otp = this.migrationChangeOtp(otp)
        if(!otp.warningNbMonthsToEnd) otp.warningNbMonthsToEnd= labo.data.warningNbMonthsToEnd
        if(!otp.warningNbRepeats) otp.warningNbRepeats= labo.data.warningNbRepeats
        if(!otp.warningNbDaysBetweenRepeats) otp.warningNbDaysBetweenRepeats= labo.data.warningNbDaysBetweenRepeats


        if (otp.name==='O.VTPAGFM01-01-F'){
            var x=555
        }

        var posOfCurrentPeriod= !otp.budgetPeriods ? -1 : otp.budgetPeriods.findIndex(period => utilsDate.isDateIntervalCompatibleWithNow(period.datStart, period.datEnd))
        var currentPeriodAnnotation= posOfCurrentPeriod === -1 ? undefined : this.getAnnotationsOfBudgetPeriod(otp.budgetPeriods[posOfCurrentPeriod])

        let equipe = equipes.filter(equipe => equipe._id === otp.equipeId)[0];
        let classification = classifcations.filter(c => otp.classificationIds && otp.classificationIds.includes(c._id))
        
        classification = classification.map(c => c.name).sort((a, b) => a < b ? -1 : 1)
                                .reduce((acc, c) => acc + (acc !== '' ? ', ' : '') + c, '');

        let dashlet = dashlets.filter(dashlet => dashlet.id === otp._id);

        let budget = !currentPeriodAnnotation ? 0 : currentPeriodAnnotation.budgetAvailable

        let amountSpentNotYetInSap = otpSpentMap.has(otp._id) ? otpSpentMap.get(otp._id) : 0
        let sapIds = sapOtpMap.has(otp.name) ? Array.from(sapOtpMap.get(otp.name).sapIdSet).map(id => +id) : []
        let minSapDate = sapOtpMap.has(otp.name) ? sapOtpMap.get(otp.name).DateMin : ''
        let minSapId = sapOtpMap.has(otp.name) ? sapOtpMap.get(otp.name).DateMinSapId : ''
        let sapItems = this.sapService.getSapItemsBySapIdList(sapIdMap, sapIds)
        let amountEngaged = this.sapService.getAmountEngagedByOtpInSapItems(otp.name, sapItems)
        let amountBilled = !currentPeriodAnnotation ? 0 : this.sapService.getAmountInvoicedByOtpInSapItems(otp.name, currentPeriodAnnotation.datStart, sapItems)


        return {
            data: otp,
            annotation: {
                budget: budget,
                budgetPeriods: !otp.budgetPeriods ? [] : otp.budgetPeriods.map(p => this.getAnnotationsOfBudgetPeriod(p)),
                currentPeriodIndex: posOfCurrentPeriod,
                currentPeriodAnnotation: currentPeriodAnnotation,
                amountSpentNotYetInSap: amountSpentNotYetInSap,
                amountEngaged: amountEngaged,
                amountBilled: amountBilled,
                amountSpent: amountSpentNotYetInSap + amountEngaged + amountBilled,
                amountAvailable: !currentPeriodAnnotation ? 0 : (budget - amountSpentNotYetInSap - amountEngaged - amountBilled),
                equipe: equipe ? equipe.name : 'no equipe',
                classification: classification,
                dashletId: dashlet.length > 0 ? dashlet[0]._id : undefined ,
                minSapDate: minSapDate,
                minSapId: minSapId               
            }
        }
    }

    getAnnotatedOtps(): Observable<any> {
        return this.getAnnotatedOtpsMap().map(map => Array.from(map.values()))
    }


    private annotatedOtpsForBudgetMapObservable: ConnectableObservable<any>;


    getAnnotatedOtpsMap(): Observable<any> {

        if (this.annotatedOtpsForBudgetMapObservable) return this.annotatedOtpsForBudgetMapObservable

        this.annotatedOtpsForBudgetMapObservable = Observable.combineLatest(
            this.dataStore.getDataObservable('otps'),
            this.getOtpMoneySpentMapObservable(),
            this.sapService.getSapIdMapObservable(),
            this.sapService.getSapOtpMapObservable(),
            this.dataStore.getDataObservable('equipes'),
            this.userService.getOtpDashletsForCurrentUser(),
            this.adminService.getLabo(),
            this.dataStore.getDataObservable('otp.product.classifications'),
            (otps, otpSpentMap, sapIdMap, sapOtpMap, equipes, dashlets, labo, classifcations) => {
                var a = otps.map(otp => this.createAnnotatedOtpForBudget(otp, otpSpentMap, sapIdMap, sapOtpMap, equipes, dashlets, labo, classifcations))
                var b = a.sort((a, b) => a.data.name < b.data.name ? -1 : 1)
                return utils.hashMapFactoryForAnnotated(b)
            }).publishReplay(1);

        this.annotatedOtpsForBudgetMapObservable.connect();

        return this.annotatedOtpsForBudgetMapObservable
    }

    getAnnotatedFinishingOtps(): Observable<any> {
        return this.getAnnotatedOtps().map(otps => otps.filter(otp => otp.annotation.currentPeriodAnnotation).filter(otp => otp.annotation.amountAvailable > 1).filter(otp => {
            var warningNbMonthsToEnd= +otp.data.warningNbMonthsToEnd
            if (!warningNbMonthsToEnd) return false
            var dat= moment(otp.annotation.currentPeriodAnnotation.datEnd, 'DD/MM/YYYY HH:mm:ss').add(-warningNbMonthsToEnd, 'month').add(1, 'day').startOf('day') 
            var now = moment()
            return now.isAfter(dat)
        }));
    }

    getAnnotatedOtpsByEquipe(equipeId): Observable<any> {
        return this.getAnnotatedOtps().map(otps => otps.filter(otp => otp.data.equipeId === equipeId));
    }

    getAnnotatedOpenOtpsByCategory(categoryId): Observable<any> {
        return this.getAnnotatedOtps().map(otps => otps.filter(otp => !otp.data.isBlocked && !otp.data.isClosed && otp.data.categoryIds && otp.data.categoryIds.includes(categoryId)));
    }

    getAnnotatedOtpsByClassification(classificationId): Observable<any> {
        return this.getAnnotatedOtps().map(otps => otps.filter(otp => otp.data.classificationIds && otp.data.classificationIds.includes(classificationId)));
    }


    getAnnotatedOtpById(otpId): Observable<any> {
        return this.getAnnotatedOtps().map(otps => {
            let otpFiltered = otps.filter(otp => otp.data._id === otpId);
            return otpFiltered.length === 0 ? null : otpFiltered[0];
        });
    }

    getClassificationsForAutocomplete() {
        return this.dataStore.getDataObservable('otp.product.classifications').map(classifications => classifications.map(eq => {
            return {
                id: eq._id,
                name: eq.name
            }
        }));
    }

    getSelectableClassifications(): Observable<SelectableData[]> {
        return this.dataStore.getDataObservable('otp.product.classifications').map(categories => {
            return categories.sort((cat1, cat2) => { return cat1.name < cat2.name ? -1 : 1; }).map(category =>
                new SelectableData(category._id, category.name)
            )
        });
    }

    getAnnotatedClassifications(): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('otp.product.classifications'), this.getAnnotatedOtps(), this.dataStore.getDataObservable('categories'),
            (classifications, otps, categories) => {
                return classifications.map(classification => {
                    var otpsAcceptable= otps
                        .filter(otp => !otp.data.isBlocked && !otp.data.isClosed && !otp.data.isDeleted && otp.annotation.currentPeriodAnnotation && otp.data.classificationIds)
                        .filter(otp => otp.data.classificationIds.includes(classification._id))
                    
                    var otpsAcceptableUnRestricted= otpsAcceptable.filter(otp => !otp.data.isLimitedToOwner)
                    var otpsAcceptableRestricted= otpsAcceptable.filter(otp => otp.data.isLimitedToOwner)

                    return {
                        data: classification,
                        annotation: {
                            categoriesTxt: categories.filter(c => classification.categoryIds && classification.categoryIds.includes(c._id)).map(c => c.name)
                                                .sort((a, b) => a < b ? -1 : 1).reduce((a, b) => a + (a==='' ? '' : ', ') + b, ''),
                            availableUnRestricted: otpsAcceptableUnRestricted.reduce((acc, otp) => acc + otp.annotation.amountAvailable, 0),
                            availableRestricted: otpsAcceptableRestricted.reduce((acc, otp) => acc + otp.annotation.amountAvailable, 0),                            
                        }
                    }
                }).sort((a, b) => a.data.name.toUpperCase() < b.data.name.toUpperCase() ? -1 : 1)
            }
        )       
    }

}