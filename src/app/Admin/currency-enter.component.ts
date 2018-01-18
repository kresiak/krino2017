import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from '../Shared/Services/data.service'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-enter-currency',
        templateUrl: './currency-enter.component.html'
    }
)

export class CurrencyEnterComponent {
    constructor(private dataStore: DataStore, private formBuilder: FormBuilder) {
    }

    public currencyEnterForm: FormGroup
    public isPageRunning: boolean = true

    ngOnInit(): void {
        const priceRegEx = `^\\d+(.\\d*)?$`;

        this.currencyEnterForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(1)]],
            conversion: ['', [Validators.required, Validators.pattern(priceRegEx)]]
        });

    }

    save(formValue, isValid) {
        this.dataStore.addDataWithoutLabo('currencies', {
            name: formValue.name,
            conversionToEuro: +formValue.conversion
        }).subscribe(res => {
            this.resetLabEnterForm();
        })
    }

    resetLabEnterForm() {
        this.currencyEnterForm.reset();
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


}