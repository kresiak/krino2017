import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-platform-correction',
        templateUrl: './platform-correction.component.html'
    }
)
export class PlatformCorrectionComponent implements OnInit {
    constructor(private formBuilder: FormBuilder, private dataStore: DataStore) {
    }

public correctionForm: FormGroup
public correctionList: any
public isPageRunning: boolean = true

    ngOnInit(): void {
        this.correctionForm = this.formBuilder.group({
            correctionType: ['', [Validators.required, Validators.minLength(2)]],
            shortcut: [''],
            defaultPerCent: ['', [Validators.required]]
        })

        this.dataStore.getDataObservable('platform.correction.types').takeWhile(() => this.isPageRunning).subscribe(correction => {
            if (!comparatorsUtils.softCopy(this.correctionList, correction))
                this.correctionList= comparatorsUtils.clone(correction)            
        })
        
    }

    save(formValue, isValid) {
        this.dataStore.addData('platform.correction.types', {
            name: formValue.correctionType,
            shortcut: formValue.shortcut,
            defaultPerCent: formValue.defaultPerCent
        }).subscribe(res =>
        {
            this.reset()
        })
    }

    reset()
    {
        this.correctionForm.reset()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    nameCorrectionUpdated(name, correctionItem) {
        correctionItem.name = name
        this.dataStore.updateData('platform.correction.types', correctionItem._id, correctionItem)
    }

    shortcutCorrectionUpdated(shortcut, correctionItem) {
        correctionItem.shortcut = shortcut
        this.dataStore.updateData('platform.correction.types', correctionItem._id, correctionItem)
    }

    defaultPerCentUpdated(defaultPerCent, correctionItem) {
        correctionItem.defaultPerCent = +defaultPerCent
        this.dataStore.updateData('platform.correction.types', correctionItem._id, correctionItem)
    }

    isOnProductUpdated(ischecked, correctionItem) {
        correctionItem.isOnProduct = ischecked
        this.dataStore.updateData('platform.correction.types', correctionItem._id, correctionItem)
    }

    isOnTotalUpdated(ischecked, correctionItem) {
        correctionItem.isOnTotal = ischecked
        this.dataStore.updateData('platform.correction.types', correctionItem._id, correctionItem)
    }

    isOnLabourUpdated(ischecked, correctionItem) {
        correctionItem.isOnLabour = ischecked
        this.dataStore.updateData('platform.correction.types', correctionItem._id, correctionItem)
    }
    

}