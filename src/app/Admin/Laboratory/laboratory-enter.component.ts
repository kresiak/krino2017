import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from 'gg-basic-data-services'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-enter-labo',
        templateUrl: './laboratory-enter.component.html'
    }
)

export class LaboratoryEnterComponent {
    constructor(private dataStore: DataStore, private formBuilder: FormBuilder) {
    }

    public labEnterForm: FormGroup
    public isPageRunning: boolean = true

    ngOnInit(): void {
        const emailRegex = /^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}$/i;

        this.labEnterForm = this.formBuilder.group({
            laboName: ['', [Validators.required, Validators.minLength(2)]],
            laboShortName: ['', [Validators.required, Validators.minLength(2)]],
            userFirstName: ['', [Validators.required, Validators.minLength(2)]],
            userLastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],            
            userPassword: ['', [Validators.required, Validators.minLength(2)]]
        });

    }

    save(formValue, isValid) {

        Observable.forkJoin(
            this.dataStore.addDataWithoutLabo('labos.list', {
                name: formValue.laboName,
                shortcut: formValue.laboShortName,
            }),
            this.dataStore.addDataWithoutLabo('users.krino', {
                name: formValue.userLastName,
                firstName: formValue.userFirstName,
                laboName: formValue.laboShortName,
                password: formValue.userPassword,
                isAdmin: true,
                email: formValue.email
            }),            
        ).first().subscribe(res => {
            var x = res;
            this.resetLabEnterForm();
        });
    }

    resetLabEnterForm() {
        this.labEnterForm.reset();
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


}