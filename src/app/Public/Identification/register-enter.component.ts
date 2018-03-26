import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { AuthAnoynmousService, SignedInStatusInfo } from './../../Shared/Services/auth-anonymous.service'
import { FormItemStructure, FormItemType} from 'gg-ui'

@Component(
    {
        selector: 'gg-register-enter',
        templateUrl: './register-enter.component.html'
    }
)
export class RegisterEnterComponent implements OnInit {
    isPageRunning: boolean = true;
    public registerEnterForm: FormGroup
    authorizationStatusInfo: SignedInStatusInfo
    flagIsError: boolean = false
    errorMsg: string

    public formStructure: FormItemStructure[]= []

    constructor(private dataStore: DataStore, private authAnoynmousService: AuthAnoynmousService) {
    }

    ngOnInit(): void {
        const emailRegex = /^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}$/i;

        this.formStructure.push(new FormItemStructure('firstName', 'PUBLIC.IDENTIFICATION.LABEL.FIRST NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('lastName', 'PUBLIC.IDENTIFICATION.LABEL.LAST NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('email', 'PUBLIC.IDENTIFICATION.LABEL.E-MAIL ADDRESS', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('laboName', 'PUBLIC.IDENTIFICATION.LABEL.LABO', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('password', 'PUBLIC.IDENTIFICATION.LABEL.PASSWORD', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('repeatPassword', 'PUBLIC.IDENTIFICATION.LABEL.REPEAT PASSWORD', FormItemType.InputText, {isRequired: true, minimalLength: 2}))

        this.authAnoynmousService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    formSaved(data) {
        if (data.password !== data.repeatPassword) {
            this.flagIsError = true
            this.errorMsg = 'Password not matching'
            return
        }

        this.flagIsError = false
        this.errorMsg = ''

        this.dataStore.getDataObservable('users.public').first().map(users => users.filter(u => u.email === data.email.trim()).length).subscribe(nbUsersAlready => {
            if (nbUsersAlready === 0) {
                this.dataStore.addData('users.public', {
                    firstName: data.firstName,
                    name: data.lastName,
                    email: data.email.trim(),
                    departmentName: data.laboName,
                    password: data.password
                }).first().subscribe(res => {
                    data.setSuccess('OK')
            });
            }
            else {
                this.flagIsError = true
                this.errorMsg = 'Email address already registered. Use another one. Or sign in with your password.'
            }
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

}