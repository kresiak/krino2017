import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { OtpService } from '../../Shared/Services/otp.service'
import { VoucherService } from '../../Shared/Services/voucher.service'
import { DataStore } from 'gg-basic-data-services'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-voucher-request',
        templateUrl: './voucher-request.component.html'
    }
)

export class AdminWebShoppingVoucherRequestComponent {
    public voucherForm: FormGroup;

    constructor(private dataStore: DataStore, private formBuilder: FormBuilder, private otpService: OtpService, private voucherService: VoucherService, private _sanitizer: DomSanitizer) {

    }

    @Input() openRequest: any
    public otpList: any

    ngOnInit(): void {

        this.voucherForm = this.formBuilder.group({
            sapId: ['', [Validators.required, Validators.minLength(5)]],
            otp: ['', [Validators.required, Validators.minLength(5)]]
        })

        this.otpService.getAnnotatedOpenOtpsByCategory(this.openRequest.categoryId).subscribe(otps => {
            this.otpList = otps.map(otp => {
                return {
                    id: otp.data._id,
                    value: otp.data.name
                }
            })
        })
    }

    save(formValue, isValid) {
        var data= {
            userId: this.openRequest.userId,
            supplierId: this.openRequest.supplierId,
            categoryId: this.openRequest.categoryId,
            sapId: formValue.sapId,
            otpId: formValue.otp.id
        }

        this.voucherService.createVoucher(data)
        
    }

    reset() {
        this.voucherForm.reset();
    }

    autocompleListFormatter = (data: any): SafeHtml => {
        let html = `<span>${data.value}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    }
}