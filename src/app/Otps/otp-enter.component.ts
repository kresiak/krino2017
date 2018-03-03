import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { Observable, Subscription } from 'rxjs/Rx'
import {utilsDates as dateUtils} from 'gg-basic-code'
import { FormItemStructure, FormItemType} from 'gg-ui'

@Component({
    selector: 'gg-otp-enter',
    templateUrl: './otp-enter.component.html'
})
export class OtpEnterComponent implements OnInit {

    constructor(private dataStore: DataStore) {

    }

    @Input() equipeId: string;

    public formStructure: FormItemStructure[]= []

    ngOnInit(): void {
        this.formStructure.push(new FormItemStructure('name', 'OTP.LABEL.OTP', FormItemType.InputText, {isRequired: true, minimalLength: 5}))
        this.formStructure.push(new FormItemStructure('isAnnual', 'OTP.LABEL.IS ANNUAL', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('budget', 'OTP.LABEL.BUDGET', FormItemType.InputNumber, {isRequired: true, minNumber: 1}))        
        this.formStructure.push(new FormItemStructure('description', 'OTP.LABEL.DESCRIPTION', FormItemType.InputText, {isRequired: true}))
        this.formStructure.push(new FormItemStructure('datStart', 'OTP.LABEL.FROM', FormItemType.GigaDate))
        this.formStructure.push(new FormItemStructure('datEnd', 'OTP.LABEL.TO', FormItemType.GigaDate)) 
        this.formStructure.push(new FormItemStructure('priority', 'OTP.LABEL.PRIORITY', FormItemType.InputNumber, {isRequired: true, minNumber: 1}))                       
        this.formStructure.push(new FormItemStructure('note', 'OTP.LABEL.NOTE', FormItemType.InputText))        
        this.formStructure.push(new FormItemStructure('isBlocked', 'OTP.LABEL.IS BLOCKED', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isLimitedToOwner', 'OTP.LABEL.LIMITED OWNER', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isClosed', 'OTP.LABEL.IS CLOSED', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('excludeFixCost', 'OTP.LABEL.CANNOT TRANSPORT COSTS', FormItemType.InputCheckbox))        
    }

    formSaved(data) {
        var newOtpEnter: any = {
            name: data.name,
            isAnnual: data.isAnnual,
            description: data.description,
            isBlocked: data.isBlocked,
            isClosed: data.isClosed,
            excludeFixCost: data.excludeFixCost,
            isLimitedToOwner: data.isLimitedToOwner,
            equipeId: this.equipeId,
            note: data.note,
            priority: data.priority
        }
        let budgetPeriods = []
        budgetPeriods.push({
            budget: data.budget,
            datStart: data.datStart || dateUtils.nowFormated(),
            datEnd: data.datEnd || dateUtils.nowFormated()
        })
        newOtpEnter.budgetPeriods = budgetPeriods
        this.dataStore.addData('otps', newOtpEnter
        ).first().subscribe(res => {
            data.setSuccess('OK')            
        });
    }

}
