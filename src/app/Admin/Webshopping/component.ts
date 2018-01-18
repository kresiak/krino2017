import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { VoucherService } from './../../Shared/Services/voucher.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-admin-webshopping',
        templateUrl: './component.html'
    }
)

export class AdminWebShoppingComponent {
    constructor(private voucherService: VoucherService) {

    }

    @Input() state;
    @Input() initTabId= ''
    @Output() stateChanged = new EventEmitter()

    vouchersObservable: Observable<any>;
    usedVouchersObservable: Observable<any>;    
    vouchersReadyForSapObservable: Observable<any>;

    public stateInit() {
        if (!this.state) this.state = {}
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initTabId
    }

    ngOnInit(): void {
        this.stateInit()
        this.vouchersObservable = this.voucherService.getAnnotatedVouchersByCreationDate()
        this.usedVouchersObservable= this.voucherService.getAnnotatedUsedVouchersByDate()
        this.vouchersReadyForSapObservable= this.voucherService.getAnnotatedUsedVouchersReadyForSap()
    }

    public beforeTabChange($event: NgbTabChangeEvent) {        
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };
        
}