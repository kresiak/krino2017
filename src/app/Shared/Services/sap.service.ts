import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { ApiService } from 'gg-basic-data-services'
import { AdminService } from './admin.service'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import {utilsObservables as utilsObservable} from 'gg-basic-code'
import { SelectableData } from 'gg-basic-code'
import { hashMapFactoryCurry } from 'gg-basic-code/utils/observables';


@Injectable()
export class SapService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService, @Inject(AdminService) private adminService: AdminService) {
        //this.initSapIdMapObservable()
        //this.initSapOtpMapObservable()
        //this.initSapItemsObservable()
        //this.initKrinoIdMapObservable()
        //this.initTvaSetObservable()
    }

    private isConnected: boolean = false

    private connectAll() {
        if (this.isConnected) return
        this.isConnected = true;
        (this.sapIdMapObservable || this.initSapIdMapObservable()).connect();
        (this.sapOtpMapObservable || this.initSapOtpMapObservable()).connect();
        (this.sapItemsObservable || this.initSapItemsObservable()).connect()

    }

    // return values
    // =============

    getSapItemsBySapIdList(sapIdMap: Map<number, any>, sapIdList: number[]) {
        var sapItemsToReturn = []
        sapIdList.forEach(id => {
            if (sapIdMap.has(id))
                sapItemsToReturn.push(sapIdMap.get(id))
        })
        return sapItemsToReturn
    }

    getAmountEngagedByOtpInSapItems(otpName: string, sapItems: any[]) {
        var res = sapItems.reduce((acc, sapItem) => {
            return acc + sapItem.postList.filter(poste => poste.otp === otpName).reduce((acc2, poste) => {
                return acc2 + poste.amountResiduel
            }, 0)
        }, 0)
        return res
    }

    private isFactureItemAfterDate(item, date) {
        var dOtpStart = moment(date, 'DD/MM/YYYY HH:mm:ss').toDate()
        var dInvoice = moment(item.dateComptable, 'DD/MM/YYYY').toDate()
        return dInvoice >= dOtpStart
    }

    filterFactureItemsBasedOnOtp(items, otpName: string, otpStartingDate: string) {
        return items.filter(item => item.otp === otpName && !item.isBlocked && !item.isSuppr)
            .filter(item => otpStartingDate && this.isFactureItemAfterDate(item, otpStartingDate))
    }

    getAmountInvoicedByOtpInSapItems(otpName: string, otpStartingDate: string, sapItems: any[]) {
        var res = sapItems.reduce((acc, sapItem) => {
            var sumInThis = !sapItem.factured ? 0 :
                this.filterFactureItemsBasedOnOtp(sapItem.factured.data.items, otpName, otpStartingDate).reduce((acc2, item) => {
                    return acc2 + item.tvac
                }, 0)

            return acc + sumInThis
        }, 0)
        return res
    }

    // return observables
    // ==================

    getSapIdMapObservable(): Observable<Map<number, any>> {
        this.connectAll()
        return (this.sapIdMapObservable || this.initSapIdMapObservable())
    }

    getSapItemsObservable(): Observable<any> {
        this.connectAll()
        return (this.sapItemsObservable || this.initSapItemsObservable())
    }

    getSapPieceTypesInfoObservable(): Observable<any> {
        return this.getSapItemsObservable().map(sapItems => {
            return sapItems
                .reduce((map: Map<string, any>, item) => {
                    var typesPiece = item.typesPiece + '/' + (item.sapId || '').toString().length + '/' + (item.sapId || 'x').toString().substring(0, 1)
                    if (!map.has(typesPiece)) map.set(typesPiece, { minSapId: +item.sapId, maxSapId: +item.sapId, nb: 0 })
                    var obj = map.get(typesPiece)
                    obj.nb += 1
                    if (+item.sapId < obj.minSapId) obj.minSapId = +item.sapId
                    if (+item.sapId > obj.maxSapId) obj.maxSapId = +item.sapId
                    map.set(typesPiece, obj)
                    return map
                }, new Map())
        })
            .map(map => Array.from(map))
            .map(arr => arr.map(elem => {
                var a = elem[0].split('/')
                return {
                    pieceType: a[0],
                    length: a[1],
                    firstChar: a[2],
                    info: elem[1]
                }
            }).sort((a, b) => {
                return a.pieceType < b.pieceType ? -1 : 1
            }))
    }

    public getSapOtpMapObservable(): Observable<Map<string, any>> {
        this.connectAll()
        return (this.sapOtpMapObservable || this.initSapOtpMapObservable())
    }

    getSapItemsByOtpObservable(otpName: string): Observable<any> {
        return this.getSapOtpMapObservable().map(map => !map.has(otpName) ? null : Array.from(map.get(otpName).sapIdSet))
    }

    getKrinoIdMapObservable(): Observable<Map<number, number>> {
        return (this.krinoIdMapObservable || this.initKrinoIdMapObservable())
    }

    getSapItemObservable(sapId: number): Observable<any> {
        return this.getSapIdMapObservable().map(idMap => idMap.has(sapId) ? idMap.get(sapId) : {})
    }

    getSapItemsObservableBySapIdList(sapIdList: number[]): Observable<any[]> {
        return this.getSapIdMapObservable().map(sapIdMap => {
            return this.getSapItemsBySapIdList(sapIdMap, sapIdList)
        })
    }

    getSapItemsObservableByOtpAndDate(otp: string, dateMin: string): Observable<any[]> {
        return (this.sapOtpMapObservable || this.initSapOtpMapObservable()).switchMap(otpMap => {
            var sapIdList = otpMap.has(otp) ? Array.from(otpMap.get(otp).sapIdSet) : []
            return this.getSapItemsObservableBySapIdList(sapIdList as number[]).map(sapItems => sapItems.filter(mapItem => {
                var d1 = moment(mapItem.dateLastActivity, 'DD/MM/YYYY').toDate() //probably completely wrong to use date here
                var d2 = moment(dateMin, 'DD/MM/YYYY').toDate()
                return d1 >= d2
            }))
        })
    }


    // Initialisation of the shared multiplexed Observables:  P1 >> (P2 or P3)
    // - P1 initSapIdMapObservable: a Map SapId => {        
    //              - engaged:
    //                  data: as in database
    //                  annotation:        
    //                      totalHtva: total spent on engagement (summing postes)
    //                      totalTvac: ...
    //                      otpMap: Map   OTP name => {       
    //                                      totalHtva: total spent on engagement on that OTP (summing postes)
    //                                      totalTvac: ...
    //                                  }
    //              - factured:
    //                      idem as engaged
    //              - mainData: points either to factured (if present) or to engaged (if not)
    //              - date: createDate (if engaged only), otherwise dateComptable
    //              - postList: array of {poste: number, engaged: poste item if any, factured: poste item if any }
    //              - missingEngagementPoste: (only for items which have both engage and facture) set to true, if we have a billed poste without engagement counterpart
    //              - missingFacturedPoste: (only for items which have both engage and facture) set to true, if we have a engaged poste without billed counterpart
    //              - hasOtpDifference: (only for items which have both engage and facture) set to true if there is a poste with an otp divergence between engage and facture
    //          }
    //  - P2 initSapOtpMapObservable: piped on initSapIdMapObservable: a Map => OTP name => {      
    //                                                          spent: total spent on that OTP
    //                                                          sapIdSet: Set of all SAP  ids that have at least one poste on that OTP
    //                                                      }
    //  - P3 initSapItemsObservable: piped on initSapIdMapObservable: an array of all SapId Items sorted by date

    private sapIdMapObservable: ConnectableObservable<Map<number, any>> = null
    private sapOtpMapObservable: ConnectableObservable<Map<string, any>> = null
    private sapItemsObservable: ConnectableObservable<any> = null
    private krinoIdMapObservable: ConnectableObservable<Map<number, number>> = null


    private getSapItemsFilteredByResponsablesObservable(): Observable<any> {
        return this.dataStore.getDataObservable('sap.fusion')
/*             .switchMap(sapList => this.dataStore.getLaboResponsablesObservable().map(resps => {
                return sapList.filter(s => s.mainData && s.mainData.data && resps.includes(s.mainData.data.resp))
            }))
 */            .switchMap(sapList => this.dataStore.getDataObservable('otps').map(hashMapFactoryCurry(a => a.name)).map((otpMap: Map<string, any>) => {
/*                 sapList.filter(s => s.mainData && s.mainData.data && s.mainData.data.otps && s.mainData.data.otps.filter(o => otpMap.has(o)).length ===0).slice(0,10).forEach(s => {
                    console.log("sapId: " + s.sapId)
                })
 */                return sapList.filter(s => s.mainData && s.mainData.data && s.mainData.data.otps && s.mainData.data.otps.filter(o => otpMap.has(o)).length > 0)
            }))
            .map(sapList => {
                return sapList
            })
    }

    public allResponsables(): Observable<Set<string>> {
        return this.dataStore.getDataObservable('sap.fusion').map(items => {
            return items.reduce((acc, i) => {
                var set: Set<any> = acc
                if (!set.has(i.mainData.data.resp)) set.add(i.mainData.data.resp)
                return set
            }, new Set<string>())
        })
    }

    public allResponsablesSelectable() {
        return this.allResponsables().map(responsables => Array.from(responsables.values()).map(r => {
            return new SelectableData(r, r)
        }))
    }


    // P1
    private initSapIdMapObservable() {
        this.sapIdMapObservable = this.getSapItemsFilteredByResponsablesObservable()
            .map(utilsObservable.hashMapFactoryCurry(elem => elem.sapId)).publishReplay(1)
        return this.sapIdMapObservable
    }

    private getMinDateOfList(dates) {
        return dates.sort((v1, v2) => {
            var d1 = moment(v1, 'DD/MM/YYYY').toDate()
            var d2 = moment(v2, 'DD/MM/YYYY').toDate()
            return d1 > d2 ? 1 : -1
        })[0];
    }

    // P2
    private initSapOtpMapObservable() {
        this.sapOtpMapObservable = (this.sapIdMapObservable || this.initSapIdMapObservable()).map(idMap => {
            console.log('In initSapOtpMapObservable: entering')
            let otpMap = new Map<string, any>()

            Array.from(idMap.values()).forEach(value => {
                let sapId = value.mainData.data.sapId;

                var doWork = function (sapObj) {
                    if (!sapObj || !sapObj.data || !sapObj.data.items) return
                    sapObj.data.items.forEach(item => {
                        let key = item.otp
                        if (!otpMap.has(key)) otpMap.set(key, { spent: 0, sapIdSet: new Set<number>() })
                        let obj = otpMap.get(key)
                        if (!obj.sapIdSet.has(sapId)) obj.sapIdSet.add(sapId)
                        if (!obj.DateMin) {
                            obj.DateMin = item.dateCreation
                            obj.DateMinSapId = sapId
                        }
                        var dateMinOfThis = moment(item.dateCreation, 'DD/MM/YYYY').toDate()
                        var dateMinSoFar = moment(obj.DateMin, 'DD/MM/YYYY').toDate()
                        if (dateMinOfThis < dateMinSoFar) {
                            obj.DateMin = item.dateCreation
                            obj.DateMinSapId = sapId
                        }
                    })
                }

                doWork(value.engaged)
                doWork(value.factured)
            })
            console.log('In initSapOtpMapObservable: ' + otpMap.size)
            return otpMap
        }).publishReplay(1)

        return this.sapOtpMapObservable 
    }


    // P3
    initSapItemsObservable() {
        this.sapItemsObservable = this.getSapItemsFilteredByResponsablesObservable().map(saps => saps.sort((a, b) => a.counter - b.counter)).publishReplay(1)   // forst this publishReplay is not really needed...
        return this.sapItemsObservable
    }

    // P4
    initKrinoIdMapObservable() {
        this.krinoIdMapObservable = this.dataStore.getDataObservable('sap.engage').map(engs => engs.reduce((acc, eng) => {
            if (eng.ourRef && +eng.ourRef) {
                acc.set(+eng.ourRef, +eng.sapId)
            }
            return acc
        }, new Map<number, number>())).publishReplay(1)
        console.log('In initKrinoIdMapObservable')
        this.krinoIdMapObservable.connect()
        return this.krinoIdMapObservable
    }

    private sapTvaCodesObservable: ConnectableObservable<any> = null

    /*    // P5
        initTvaSetObservable() {
            this.sapTvaCodesObservable = this.dataStore.getDataObservable('sap.engage').map(engs => {
                var list = [1, 2];
                list = [...list, 3, 4];            
                var xx= engs.reduce((acc, eng) => {
                    eng.items.forEach(item => {
                        if (+item.codeTva || item.codeTva === '') {
                            var ddqw=''
                        }
                        acc.add(item.codeTva)
                    })
                    return acc
                }, new Set<string>())
                var yy= Array.from(xx).sort()
                console.log(yy.reduce((a,b) => a + ', ' + b))
                return yy
            }).publishReplay(1)
            console.log('In initTvaSetObservable')
            this.sapTvaCodesObservable.connect()
        }*/

    getSapItemsToAttributeToEquipe(): Observable<any> {
        return Observable.combineLatest(this.getSapItemsFilteredByResponsablesObservable(), this.dataStore.getDataObservable('sap.krino.annotations'), this.adminService.getLabo(), this.dataStore.getDataObservable('orders.vouchers'),
            this.dataStore.getDataObservable('otps'),
            (sapItems, sapAnnotations, labo, vouchers, otps) => {
                var krinoStartDate = moment(labo.data.krinoStartDate, 'DD/MM/YYYY HH:mm:ss')
                var fnIsDateOk = (date) => {
                    return krinoStartDate.isBefore(moment(date, 'DD/MM/YYYY'))
                }
                var sapAnnotationsMap: Map<number, any> = utilsObservable.hashMapFactoryHelper(sapAnnotations, a => a.sapId)
                var vouchersMap: Map<number, any> = utilsObservable.hashMapFactoryHelper(vouchers, a => +a.sapId.trim())
                var otpMap: Map<string, any> = utilsObservable.hashMapFactoryHelper(otps, o => o.name)

                var a = sapItems.filter(item => item.mainData && !(+item.mainData.data.ourRef))
                a = a.filter(item => !item.isSuppr)
                a = a.filter(item => !sapAnnotationsMap.has(item.sapId))
                a = a.filter(item => !vouchersMap.has(item.sapId))
                a = a.filter(item => fnIsDateOk(item.dateLastActivity))
                a = a.filter(item => {
                    var items = (item.mainData.data.items || []).filter(i => !i.isSuppr)
                    var otps = items.map(i => i.otp)
                    return otps.filter(otp => {
                        var otpData = otpMap.get(otp)
                        return otpData && !otpData.isLimitedToOwner
                    }).length > 0
                })
                return a.sort((a, b) => a.counter - b.counter)
            })
    }

    getSapItemEquipeAtributedObservable(): Observable<any> {
        return this.dataStore.getDataObservable('sap.krino.annotations').map(attributions => attributions.map(a => a.sapId))
            .switchMap(attributedSapIds => {
                return this.getSapItemsObservableBySapIdList(attributedSapIds)
            })
    }

    getSapItemByEquipeObservable(equipeId): Observable<any> {
        return this.dataStore.getDataObservable('sap.krino.annotations').map(attributions => attributions.filter(a => a.equipeId === equipeId).map(a => a.sapId))
            .switchMap(attributedSapIds => {
                return this.getSapItemsObservableBySapIdList(attributedSapIds)
            })
    }

    getSapKrinoAnnotationMap(): Observable<any> {
        return this.dataStore.getDataObservable('sap.krino.annotations').map(utilsObservable.hashMapFactoryCurry(a => a.sapId))
    }

    getSapKrinoAnnotationAnnotatedMap(): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('equipes'), this.dataStore.getDataObservable('sap.krino.annotations'), (equipes, krinoAnnots) => {
            return krinoAnnots.map(a => {
                var eq = equipes.filter(e => e._id === a.equipeId)[0]
                return {
                    data: a,
                    annotation: {
                        equipe: eq ? eq.name : 'unknown equipe'
                    }
                }
            })
        }).map(utilsObservable.hashMapFactoryCurry(a => a.data.sapId))
    }

    updateSapEquipeAttribution(sapId, equipeId, description) {
        this.dataStore.getDataObservable('sap.krino.annotations').first().subscribe(annots => {
            var theAnnot = annots.filter(a => a.sapId === sapId)[0]
            if (theAnnot && equipeId) {
                theAnnot.equipeId = equipeId
                theAnnot.description = description
                this.dataStore.updateData('sap.krino.annotations', theAnnot._id, theAnnot)
            }
            else if (theAnnot && !equipeId) {
                this.dataStore.deleteData('sap.krino.annotations', theAnnot._id)
            }
            else if (equipeId) {
                this.dataStore.addData('sap.krino.annotations', {
                    sapId: sapId,
                    equipeId: equipeId,
                    description: description
                })
            }
        })
    }
}

