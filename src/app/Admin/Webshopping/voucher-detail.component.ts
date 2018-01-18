import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from './../../Shared/Services/data.service'
import { OtpService } from '../../Shared/Services/otp.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationStatusInfo, AuthService } from '../../Shared/Services/auth.service'


@Component(
    {
        //moduleId: module.id,
        selector: 'gg-voucher-detail',
        templateUrl: './voucher-detail.component.html'
    }
)
export class VoucherDetailComponent implements OnInit {
    constructor(private dataStore: DataStore, private otpService: OtpService, private authService: AuthService) {
    }
    public pieSpentChart;

    @Input() voucherObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false

    @Input() initialTab: string = '';
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initialTab;
    }

    public subscriptionVoucher: Subscription
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription     
    

    ngOnInit(): void {
        this.stateInit();
        this.subscriptionVoucher= this.voucherObservable.subscribe(eq => {
            this.voucher = eq;
            if (this.voucher) {
                this.otpListObservable = this.otpService.getAnnotatedOpenOtpsByCategory(this.voucher.data.categoryId).map(otps => otps.map(otp => {
                    return {
                        id: otp.data._id,
                        name: otp.data.name
                    }
                }));
            }
        });
        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })        
        
    }

    ngOnDestroy(): void {
         this.subscriptionVoucher.unsubscribe()
         this.subscriptionAuthorization.unsubscribe()
    }    


    public voucher: any;
    public otpListObservable: any

    public beforeTabChange($event: NgbTabChangeEvent) {

        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    sapIdUpdated(name) {
        this.voucher.data.sapId = name;
        this.dataStore.updateData('orders.vouchers', this.voucher.data._id, this.voucher.data);
    }

    otpChanged(newid) {
        this.voucher.data.otpId = newid;
        this.dataStore.updateData('orders.vouchers', this.voucher.data._id, this.voucher.data);
    }

    isInSapUpdated(flag) {
        if (this.voucher.data.shopping) {
            this.voucher.data.shopping.isSapUpdated = flag
            this.dataStore.updateData('orders.vouchers', this.voucher.data._id, this.voucher.data);
        }
    }

    deletePurchase() {
        if (this.voucher.data.shopping) {
            delete this.voucher.data.shopping
            this.voucher.annotation.isUsed= false
            this.dataStore.updateData('orders.vouchers', this.voucher.data._id, this.voucher.data);
        }
    }


    deliveryChanged(newStatus) {
        this.voucher.data.delivery = newStatus;
        this.dataStore.updateData('orders.vouchers', this.voucher.data._id, this.voucher.data);        
    }
}