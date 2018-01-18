import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { SapService } from './../Shared/Services/sap.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NavigationService } from './../Shared/Services/navigation.service'

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
                        sapId: sapObj.mainData.data.sapId
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
                            poste: sapItem.poste,
                            date: sapItem.dateComptable,   //dateCreation
                            product: sapItem.product,
                            tvac: sapItem.tvac,
                            htva: sapItem.htva, 
                            tvaCode: sapItem.codeTva,
                            pieceId: sapItem.pieceId
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