import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { Observable, Subscription } from 'rxjs/Rx'
import { FormItemStructure, FormItemType} from 'gg-ui'

@Component({
    selector: 'gg-category-enter',
    templateUrl: './category-enter.component.html'
})
export class CategoryEnterComponent implements OnInit {

    constructor(private dataStore: DataStore) {

    }

    public isPageRunning: boolean = true

    public formStructure: FormItemStructure[]= []
    public categoryNameObservable

    ngOnInit(): void {
        this.categoryNameObservable= this.dataStore.getDataObservable('categories').map(categories => categories.map(c => c.name))

        this.formStructure.push(new FormItemStructure('name', 'CATEGORY.LABEL.NAME', FormItemType.InputText, {isRequired: true, minimalLength: 5}))
        this.formStructure.push(new FormItemStructure('noArticle', 'CATEGORY.LABEL.NO OF ARTICLE ENTER', FormItemType.InputText, {isRequired: true, minimalLength: 5}))
        this.formStructure.push(new FormItemStructure('groupMarch', 'CATEGORY.LABEL.GROUP MARCHANDISE ENTER', FormItemType.InputText, {isRequired: true, minimalLength: 5}))
        this.formStructure.push(new FormItemStructure('isBlocked', 'CATEGORY.LABEL.IS BLOCKED ENTER', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isOffice', 'CATEGORY.LABEL.OFFICE SPECIFIC ENTER', FormItemType.InputCheckbox))
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    formSaved(data) {
        this.dataStore.addData('categories', {
            name: data.name,
            noArticle: data.noArticle,
            groupMarch: data.groupMarch,
            isBlocked: data.isBlocked,
            isOffice: data.isOffice
        }).first().subscribe(res => {
            data.setSuccess('OK')
        });
    }

}

