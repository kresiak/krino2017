import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { OrderService } from './../Shared/Services/order.service'
import { ConfigService } from './../Shared/Services/config.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { SapService } from './../Shared/Services/sap.service'
import * as comparatorsUtils from './../Shared/Utils/comparators'
import * as observableUtils from './../Shared/Utils/observables'
import * as moment from "moment"

enum SortKey {
    No = 0,
    SapId = 1,
    OurRef = 2,
    EngagDate = 3,
    LastDate = 4,
}

@Component(
    {
        selector: 'gg-sap-list',
        templateUrl: './sap-list.component.html'
    }
)
export class SapListComponent implements OnInit {
    mapNonAttributedSapItems: Map<string, any>;
    SortKey: typeof SortKey = SortKey;        // Necessary: see https://stackoverflow.com/questions/35923744/pass-enums-in-angular2-view-templates  

    @Input() sapsObservable: Observable<any>;
    @Input() state;
    @Input() path: string = 'saps'
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    public sortKey: SortKey = SortKey.No
    public sortFnObservable: BehaviorSubject<any> = new BehaviorSubject<any>(undefined)

    public saps: any[] = [];
    public sapKrinoAnnotationMap: any;
    public orderEquipeInfoMap: Map<number, any>;

    public isPageRunning: boolean = true

    constructor(private sapService: SapService, private orderService: OrderService) {
    }

    fnFilterSap = (sap, txt) => {
        if (txt === '' || txt === '$' || txt === '#') return true
        if (txt.startsWith('$F')) {
            return sap.hasFactureFinale;
        }
        if (txt.startsWith('$D')) {
            return sap.isSuppr;
        }
        if (txt.startsWith('$T')) {
            return +sap.residuEngaged < 0.05;
        }
        if (txt.startsWith('$O')) {
            return +sap.residuEngaged >= 0.05;
        }
        if (txt.startsWith('$P')) {
            let typ = txt.slice(2);
            if (typ.length === 2) {
                return sap.factured && sap.factured.data.isNoEngag && sap.typesPiece.toUpperCase().includes(typ);
            }
            return sap.factured && sap.factured.data.isNoEngag;
        }
        if (txt.startsWith('$EO')) {
            return sap.hasOtpError;
        }
        if (txt.startsWith('$NA')) {
            return this.mapNonAttributedSapItems && this.mapNonAttributedSapItems.has(sap.mainData.data.sapId);
        }

        if (txt.startsWith('$E>') && +txt.slice(3)) {
            let montant = +txt.slice(3);
            return + sap.residuEngaged >= montant;
        }
        if (txt.startsWith('$E<') && +txt.slice(3)) {
            let montant = +txt.slice(3);
            return + sap.residuEngaged && + sap.residuEngaged <= montant;
        }
        if (txt.startsWith('$R>') && +txt.slice(3)) {
            let montant = +txt.slice(3);
            return + sap.alreadyBilled >= montant;
        }
        if (txt.startsWith('$R<') && +txt.slice(3)) {
            let montant = +txt.slice(3);
            return + sap.alreadyBilled && + sap.residuEngaged <= montant;
        }
        if (txt.startsWith('#>') && +txt.slice(2)) {
            let montant = +txt.slice(2);
            return sap.engaged && sap.engaged.data.items.length > montant
        }
        if (txt.startsWith('#<') && +txt.slice(2)) {
            let montant = +txt.slice(2);
            return sap.engaged && sap.engaged.data.items.length < montant
        }
        if (txt.startsWith('#=') && +txt.slice(2)) {
            let montant = +txt.slice(2);
            return sap.engaged && sap.engaged.data.items.length == montant
        }

        var isTxtInEquipeInfo = (txt) => {
            this.setEquipeInformationBySapItem(sap)
            if (!sap.equipeInfo) return false
            return sap.equipeInfo.toUpperCase().includes(txt) || (sap.extraEquipeInfo || '').toUpperCase().includes(txt)
        }

        if (txt.startsWith('#EQ:') && txt.slice(4)) {
            let txt2 = txt.slice(4);
            return isTxtInEquipeInfo(txt2)
        }

        return sap.mainData.data.ourRef.toString().toUpperCase().includes(txt) || sap.mainData.data.sapId.toString().toUpperCase().includes(txt) || sap.mainData.data.supplier.toUpperCase().includes(txt)
            || sap.mainData.annotation.otpTxt.toUpperCase().includes(txt) || sap.mainData.data.resp.toString().toUpperCase().includes(txt) || isTxtInEquipeInfo(txt)

    }

    public setEquipeInformationBySapItem(sap) {
        if (sap.mainData && sap.mainData.data.ourRef && +sap.mainData.data.ourRef && this.orderEquipeInfoMap.has(+sap.mainData.data.ourRef)) {
            var orderInfo = this.orderEquipeInfoMap.get(+sap.mainData.data.ourRef)
            sap.equipeInfo = orderInfo.annotation.equipe || orderInfo.annotation.equipeGroup
            sap.extraEquipeInfo = orderInfo.annotation.equipeGroupRepartition
        }
        if (!(sap.mainData && sap.mainData.data.ourRef && +sap.mainData.data.ourRef)) {
            if (this.sapKrinoAnnotationMap && this.sapKrinoAnnotationMap.has(sap.mainData.data.sapId)) {
                sap.equipeInfo = this.sapKrinoAnnotationMap.get(sap.mainData.data.sapId).annotation.equipe
            }
        }
    }

    public setEquipeInformation() {
        if (!this.orderEquipeInfoMap || !this.sapKrinoAnnotationMap) return
        this.saps.forEach(sap => {
            this.setEquipeInformationBySapItem(sap)
        })
    }

    setSaps(saps) {
        this.saps = saps
        this.setEquipeInformation()
    }

    ngOnInit(): void {

        this.stateInit();

        this.orderService.getOrderEquipeInfoMap().takeWhile(() => this.isPageRunning).subscribe(orderMap => {
            this.orderEquipeInfoMap = orderMap
            this.setEquipeInformation()
        })

        this.sapService.getSapKrinoAnnotationAnnotatedMap().takeWhile(() => this.isPageRunning).subscribe(sapKrinoAnnotationMap => {
            this.sapKrinoAnnotationMap = sapKrinoAnnotationMap
            this.setEquipeInformation()
        })

        this.sapService.getSapItemsToAttributeToEquipe().takeWhile(() => this.isPageRunning).subscribe(res => {
            this.mapNonAttributedSapItems = observableUtils.hashMapFactoryHelper(res, a => a.sapId)
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getSapObservable(sapId: number) {
        return this.sapService.getSapItemObservable(sapId)
    }

    // This is typically used for accordions with ngFor, for remembering the open Accordion Panel (see template as well)    
    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
            this.stateChanged.next(this.state);
        }
    };

    // This is typically used for accordions with ngFor and tabsets in the cild component. As the ngFor disposes and recreates the child component, we need a way to remember the opened tab
    public childStateChanged(newState, objectId) {
        this.state[objectId] = newState;
        this.stateChanged.next(this.state);
    }


    public setSortKey(sortKey: SortKey) {
        this.sortKey = sortKey === this.sortKey ? SortKey.No : sortKey
        var fn: any

        switch (this.sortKey) {
            case SortKey.No: {
                fn = undefined
                break
            }
            case SortKey.SapId: {
                fn = (a, b) => {
                    return a.mainData.data.sapId <= b.mainData.data.sapId ? 1 : -1
                }
                break
            }
            case SortKey.OurRef: {
                fn = (a, b) => {
                    return a.mainData.data.ourRef < b.mainData.data.ourRef ? 1 :
                        (a.mainData.data.ourRef > b.mainData.data.ourRef ? -1 : (a.mainData.data.sapId <= b.mainData.data.sapId ? 1 : -1))
                }
                break
            }
            case SortKey.EngagDate: {
                fn = (a, b) => {
                    var d1 = moment(a.engaged ? a.engaged.data.maxDate : '01/01/1970', 'DD/MM/YYYY HH:mm:ss').toDate()
                    var d2 = moment(b.engaged ? b.engaged.data.maxDate : '01/01/1970', 'DD/MM/YYYY HH:mm:ss').toDate()

                    return d1 < d2 ? 1 : (d1 > d2 ? -1 : (a.mainData.data.sapId <= b.mainData.data.sapId ? 1 : -1))
                }
                break
            }
            case SortKey.LastDate: {
                fn = (a, b) => {
                    var d1 = moment(a.dateLastActivity ? a.dateLastActivity : '01/01/1970', 'DD/MM/YYYY HH:mm:ss').toDate()
                    var d2 = moment(b.dateLastActivity ? b.dateLastActivity : '01/01/1970', 'DD/MM/YYYY HH:mm:ss').toDate()

                    return d1 < d2 ? 1 : (d1 > d2 ? -1 : (a.mainData.data.sapId <= b.mainData.data.sapId ? 1 : -1))
                }
                break
            }
        }
        this.sortFnObservable.next(fn)
    }

    public isSortKeySet(sortKey: SortKey) {
        return this.sortKey === sortKey
    }
}