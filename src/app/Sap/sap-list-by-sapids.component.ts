import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { SapService } from './../Shared/Services/sap.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NavigationService } from './../Shared/Services/navigation.service'
import { utilsDates as dateUtils, utilsReports as reportsUtils} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-sap-by-sapids-list',
        templateUrl: './sap-list-by-sapids.component.html'
    }
)
export class SapListBySapIdsComponent implements OnInit {
    @Input() sapIdList: any[];
    @Input() otp: any
    @Input() state;
    @Input() path: string = 'saps'
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }


    constructor(private sapService: SapService, private navigationService: NavigationService) {
    }

    public sapsObservable: Observable<any>
    public subscription: Subscription
    public totalEngaged: number=0

    public sapPostesEngOpenList: any[]
    public sapFacturesItemsList: any[]

    ngOnInit(): void {
        this.stateInit();
        this.sapsObservable = this.sapService.getSapItemsObservableBySapIdList(this.sapIdList)
        this.subscription = this.sapsObservable.subscribe(sapList => {
            this.totalEngaged= this.sapService.getAmountEngagedByOtpInSapItems(this.otp.data.name, sapList)

            this.sapPostesEngOpenList= []
            this.sapFacturesItemsList= []
            var sum: number= 0
            var sum2: number= 0
            sapList.sort((a, b) => a.mainData.data.sapId- b.mainData.data.sapId).forEach(sapObj => {
                sapObj.postList.filter(poste => poste.otp === this.otp.data.name && poste.amountResiduel > 0).forEach(sapPoste => {
                    sum+= sapPoste.amountResiduel
                    this.sapPostesEngOpenList.push({
                        sum: sum,
                        poste: sapPoste,
                        sapId: sapObj.mainData.data.sapId,
                        supplier: sapObj.mainData.data.supplier,
                        resp: sapObj.mainData.data.resp
                    })
                })

                if (sapObj.factured) {
                    this.sapService.filterFactureItemsBasedOnOtp(sapObj.factured.data.items, this.otp.data.name, (this.otp.annotation.currentPeriodAnnotation || {}).datStart)
                    .sort((a,b)=>a.poste-b.poste)
                    .forEach(sapItem => {
                        //sum2 += sapItem.tvac
                        this.sapFacturesItemsList.push({
                            //sum: sum2,
                            sapId: sapObj.mainData.data.sapId,
                            supplier: sapObj.mainData.data.supplier,
                            poste: sapItem.poste,
                            date: sapItem.dateComptable,   //dateCreation
                            product: sapItem.product,
                            tvac: sapItem.tvac,
                            htva: sapItem.htva, 
                            tvaCode: sapItem.codeTva,
                            pieceId: sapItem.pieceId,
                            item: sapItem
                        })
                    })
                }
            })
            this.sapFacturesItemsList.sort((a, b)=> {
                if (a.pieceId !== b.pieceId) return +a.pieceId - +b.pieceId
                return +a.poste - +b.poste
            } )

            this.sapFacturesItemsList.forEach(item => {
                sum2 += item.tvac
                item.sum= sum2
            })

        })
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe()
    }

    createReportEngaged() {
        var fnFormat = poste => {
            return {       
                SapId: poste.sapId,
                Poste: poste.poste.poste,
                EngagedAmount: poste.poste.amountEngaged.toLocaleString('fr-BE', {useGrouping: false}),
                InvoicedAmount: poste.poste.amountFactured.toLocaleString('fr-BE', {useGrouping: false}),
                StillOpenAmount: poste.poste.amountResiduel.toLocaleString('fr-BE', {useGrouping: false}),
                QtyEngaged: poste.poste.qtyEngaged,
                QtyInvoiced: poste.poste.qtyFactured,
                Product: poste.poste.product,
                Tva: poste.poste.codeTvaEngag,
                LastInvoice: dateUtils.formatShortDate(poste.poste.lastInvoiceDate),
                Supplier: poste.supplier,
                Responsable: poste.resp
            }
        }

        reportsUtils.generateReport(this.sapPostesEngOpenList.map(fnFormat))        
    }

    createReportInvoiced() {
        var fnFormat = item => {
            return {       
                SapId: item.sapId,
                Piece: item.pieceId,
                Poste: item.item.poste,
                Type: item.item.pieceType,                
                DateComptable: dateUtils.formatShortDate(item.item.dateComptable),
                HTva: item.htva.toLocaleString('fr-BE', {useGrouping: false}),
                TvaC: item.tvac.toLocaleString('fr-BE', {useGrouping: false}),
                Quantity: item.item.quantity,
                Product: item.product,
                Supplier: item.supplier,
                DatePiece: dateUtils.formatShortDate(item.item.datePiece),
            }
        }

        reportsUtils.generateReport(this.sapFacturesItemsList.map(fnFormat))        
    }
    
    public beforeTabChange($event: NgbTabChangeEvent) {
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public childAllStateChanged($event) {
        this.state.All = $event;
        this.stateChanged.next(this.state);
    }

    navigateToSap(sapId) {
        this.navigationService.maximizeOrUnmaximize('/sap', sapId, this.path+'|O:EngagementOpen', false)
    }

    navigateToSap2(sapId) {
        this.navigationService.maximizeOrUnmaximize('/sap', sapId, this.path+'|O:Invoiced', false)
    }


}