import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { AuthAnoynmousService, SignedInStatusInfo } from './../../Shared/Services/auth-anonymous.service'


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


    constructor(private dataStore: DataStore, private formBuilder: FormBuilder, private authAnoynmousService: AuthAnoynmousService) {
    }

    ngOnInit(): void {
        const emailRegex = /^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}$/i;

        this.registerEnterForm = this.formBuilder.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],
            laboName: ['', [Validators.required, Validators.minLength(2)]],
            password: ['', [Validators.required, Validators.minLength(2)]],
            repeatPassword: ['', [Validators.required, Validators.minLength(2)]]
        });

        this.authAnoynmousService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    saveUser(formValue, isValid) {
        if (formValue.password !== formValue.repeatPassword) {
            this.flagIsError = true
            this.errorMsg = 'Password not matching'
            return
        }

        this.flagIsError = false
        this.errorMsg = ''

        this.dataStore.getDataObservable('users.public').first().map(users => users.filter(u => u.email === formValue.email.trim()).length).subscribe(nbUsersAlready => {
            if (nbUsersAlready === 0) {
                this.dataStore.addData('users.public', {
                    firstName: formValue.firstName,
                    name: formValue.lastName,
                    email: formValue.email.trim(),
                    departmentName: formValue.laboName,
                    password: formValue.password
                }).first().subscribe(res => {
                    var x = res;
                    this.resetRegisterEnterForm();
                });
            }
            else {
                this.flagIsError = true
                this.errorMsg = 'Email address already registered. Use another one. Or sign in with your password.'
            }
        })

    }

    resetRegisterEnterForm() {
        this.registerEnterForm.reset();
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

}