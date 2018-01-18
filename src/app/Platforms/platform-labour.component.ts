import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-platform-labour',
        templateUrl: './platform-labour.component.html'
    }
)
export class PlatformLabourComponent implements OnInit {
    constructor(private formBuilder: FormBuilder, private dataStore: DataStore) {
    }

public labourForm: FormGroup
public labourList = []
public isPageRunning: boolean = true

    ngOnInit(): void {
        this.labourForm = this.formBuilder.group({
            labourType: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            hourlyRate: ['', Validators.required]
        })

        this.dataStore.getDataObservable('platform.labour.types').takeWhile(() => this.isPageRunning).subscribe(labour => {
            if (!comparatorsUtils.softCopy(this.labourList, labour))
                this.labourList= comparatorsUtils.clone(labour)            
        })
        
    }

    save(formValue, isValid) {
        this.dataStore.addData('platform.labour.types', {
            name: formValue.labourType,
            description: formValue.description,
            hourlyRate: formValue.hourlyRate
        }).subscribe(res =>
        {
            this.reset()
        })
    }

    reset()
    {
        this.labourForm.reset()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    nameLabourUpdated(name, labourItem) {
        labourItem.name = name
        this.dataStore.updateData('platform.labour.types', labourItem._id, labourItem)
    }

    descriptionLabourUpdated(description, labourItem) {
        labourItem.description = description
        this.dataStore.updateData('platform.labour.types', labourItem._id, labourItem)
    }

    hourlyRateLabourUpdated(hourlyRate, labourItem) {
        labourItem.hourlyRate = +hourlyRate
        this.dataStore.updateData('platform.labour.types', labourItem._id, labourItem)
    }

}