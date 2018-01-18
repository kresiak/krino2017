import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { OtpService } from '../Shared/Services/otp.service'
import { DataStore } from 'gg-basic-data-services'
import { ProductService } from '../Shared/Services/product.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { SelectableData } from './../Shared/Classes/selectable-data'

@Component(
    {
        selector: 'gg-classification-list',
        templateUrl: './classification-list.component.html'
    }
)
export class ClassificationListComponent implements OnInit {
    selectableCategoriesObservable: Observable<SelectableData[]>;

    @Input() classificationsObservable: Observable<any>;

    public classificationsList;

    constructor(private otpService: OtpService, private dataStore: DataStore, private productService: ProductService, private authService: AuthService) {
    }

    filterClassifications(classification, txt) {
        if (txt === '' || txt === '#') return true

        return classification.data.name.toUpperCase().includes(txt) || classification.data.description.toUpperCase().includes(txt)
    }


    ngOnInit(): void {
        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.selectableCategoriesObservable = this.productService.getSelectableCategories()
    }

    public isPageRunning: boolean = true


    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getOtpsObservableByClassification(classificationId) {
        return this.otpService.getAnnotatedOtpsByClassification(classificationId)
    }

    getCategoriesObservable(classificationId): Observable<any> {
        return this.dataStore.getDataObservable('otp.product.classifications').map(classificationList => classificationList.filter(c => c._id === classificationId)[0])
            .map(c => c ? c.categoryIds : undefined)
            .takeWhile(() => this.isPageRunning)
    }

    public authorizationStatusInfo: AuthenticationStatusInfo;

    classificationsNameUpdated(classificationName, classificationsItem) {
        classificationsItem.data.name = classificationName
        this.dataStore.updateData('otp.product.classifications', classificationsItem.data._id, classificationsItem.data)
    }

    classificationsDescriptionUpdated(classificationDescription, classificationsItem) {
        classificationsItem.data.description = classificationDescription
        this.dataStore.updateData('otp.product.classifications', classificationsItem.data._id, classificationsItem.data)
    }

    categorySelectionChanged(selectedIds: string[], classificationsItem) {
        classificationsItem.data.categoryIds = selectedIds;
        this.dataStore.updateData('otp.product.classifications', classificationsItem.data._id, classificationsItem.data)
    }

    categoryHasBeenAdded(newCategory: string) {
        this.productService.createCategory(newCategory);
    }

}

