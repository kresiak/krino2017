import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { OtpService } from '../Shared/Services/otp.service'
import { NavigationService } from './../Shared/Services/navigation.service'
import { SelectableData } from 'gg-basic-code'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import {utilsDates as dateUtils} from 'gg-basic-code'
import { FormItemStructure, FormItemType} from 'gg-ui'


@Component(
    {
        selector: 'gg-otp-period-detail',
        templateUrl: './otp-period-detail.component.html'
    }
)
export class OtpPeriodDetailComponent implements OnInit {
    constructor(private dataStore: DataStore, private authService: AuthService, private formBuilder: FormBuilder, private otpService: OtpService) {
    }

    public blockedAmountForm: FormGroup

    public nouvelleCreanceForm: FormGroup
    public dateNouvelleCreanceForm: string

    @Input() budgetPeriod
    @Input() otp
    @Input() budgetAnnotation

    public isPageRunning: boolean = true

    public authorizationStatusInfo: AuthenticationStatusInfo;

    public formStructure1: FormItemStructure[]= []


    ngOnInit(): void {
        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });

        this.formStructure1.push(new FormItemStructure('budgetChange', 'OTP.PERIOD.LABEL.BUDGET INCREMENT', FormItemType.InputMoney, {isRequired: true}))        
        this.formStructure1.push(new FormItemStructure('dateInBudgetChangeForm', 'OTP.PERIOD.LABEL.DATE', FormItemType.GigaDate))        
        this.formStructure1.push(new FormItemStructure('commentBudgetChange', 'OTP.PERIOD.LABEL.COMMENT', FormItemType.InputText, {isRequired: true}))
        
        this.blockedAmountForm = this.formBuilder.group({
            blockedAmount: ['', [Validators.required]],
            comment: ['', [Validators.required]]
        })

        this.nouvelleCreanceForm = this.formBuilder.group({
            depenseNouvelleCreance: ['', [Validators.required]],
            commentNouvelleCreance: ['', [Validators.required]]
        })
    }

    public getBudgetPeriodCreances() {
        return this.budgetPeriod.creances.sort(dateUtils.getSortFn(x => x.date, true))
    }


    SaveBudgetChange(data) {
        if (!this.budgetPeriod.budgetHistory) this.budgetPeriod.budgetHistory = []

        this.budgetPeriod.budgetHistory.push({
            budgetIncrement: data.budgetChange,
            date: data.dateInBudgetChangeForm || dateUtils.nowFormated(),
            comment: data.commentBudgetChange
        })
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data).first().subscribe(res => {
            data.setSuccess('OK')  
        });
    }

    saveBlockedAmount(formValue, isValid) {
        if (!isValid) return
        if (!this.budgetPeriod.blockedAmounts) this.budgetPeriod.blockedAmounts = []

        this.budgetPeriod.blockedAmounts.push({
            amount: formValue.blockedAmount,
            comment: formValue.comment
        })
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data).first().subscribe(res => {
            this.resetBlockedAmount();
        });
    }

    resetBlockedAmount() {
        this.blockedAmountForm.reset();
    }

    checkCreances(): boolean {
        var lastAmount = -1
        var isOk: boolean = true
        var copied= comparatorsUtils.clone(this.budgetPeriod.creances)
        copied.sort(dateUtils.getSortFn(x => x.date)).forEach(c => {
            if (isOk) {
                if (c.amount > this.budgetAnnotation.budgetTotalAvailable) isOk = false
                if (c.amount > lastAmount && lastAmount !== -1) isOk = false
                lastAmount = c.amount
            }
        })
        return isOk
    }

    public creanceFormError: boolean= false

    SaveNouvelleCreance(formValue, isValid) {        
        if (!isValid) return
        if (!this.budgetPeriod.creances) this.budgetPeriod.creances = []
        this.creanceFormError= false

        this.budgetPeriod.creances.push({
            date: this.dateNouvelleCreanceForm || dateUtils.nowFormated(),
            amount: formValue.depenseNouvelleCreance,
            description: formValue.commentNouvelleCreance
        })

        if (this.checkCreances()) {
            this.dataStore.updateData('otps', this.otp.data._id, this.otp.data).first().subscribe(res => {
                this.resetNouvelleCreance();
            });
        }
        else {
            this.budgetPeriod.creances.pop()
            this.creanceFormError=true
        }
    }

    public creanceUpdateError: boolean= false

    dateCreanceChangeUpdated(creanceItem, data) {
        var dateChange= data.value
        this.creanceUpdateError= false
        var saved= creanceItem.date
        creanceItem.date = dateChange
        if (this.checkCreances()) {
            this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
        }
        else {
            this.creanceUpdateError= true
            creanceItem.date= saved
            data.fnCancel()
        }        
    }

    depenseCreanceChangeUpdated(creanceItem, data) {
        var depenseChange= data.value
        if (! +depenseChange && depenseChange !== '0') return
        this.creanceUpdateError= false
        var saved= creanceItem.amount
        creanceItem.amount = +depenseChange
        if (this.checkCreances()) {
            this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
        }
        else {
            this.creanceUpdateError= true
            creanceItem.amount= saved
            data.fnCancel()
        }        
    }

    commentCreanceChangeUpdated(creanceItem, description) {
        creanceItem.description = description
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }




    resetNouvelleCreance() {
        this.nouvelleCreanceForm.reset();
    }


    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    budgetPeriodUpdated(budget) {
        this.budgetPeriod.budget = +budget;
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    datStartPeriodUpdated(date) {
        this.budgetPeriod.datStart = date;
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    datEndPeriodUpdated(date) {
        this.budgetPeriod.datEnd = date;
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    budgetChangeUpdated(budgetHistoryItem, budgetChange) {
        if (! +budgetChange && budgetChange !== '0') return
        budgetHistoryItem.budgetIncrement = +budgetChange
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    dateBudgetChangeUpdated(budgetHistoryItem, dateChange) {
        budgetHistoryItem.date = dateChange
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    commentsBudgetChangeUpdated(budgetHistoryItem, comment) {
        budgetHistoryItem.comment = comment
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

/*     dateBudgetChangeInForm(dateInForm) {
        this.dateInBudgetChangeForm = dateInForm
    }
 */
    blockedAmountUpdated(blockedAmountItem, amount) {
        if (! +amount && amount !== '0') return
        blockedAmountItem.amount = +amount
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    blockedAmountCommentUpdated(blockedAmountItem, comment) {
        blockedAmountItem.comment = comment
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    dateNouvelleCreanceInForm(dateInForm) {
        this.dateNouvelleCreanceForm = dateInForm
    }

}
