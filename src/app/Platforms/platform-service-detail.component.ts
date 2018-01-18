import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { PlatformService } from './../Shared/Services/platform.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { SelectableData } from './../Shared/Classes/selectable-data'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as comparatorsUtils from './../Shared/Utils/comparators'
import * as moment from "moment"


@Component(
    {
        selector: 'gg-platform-service-detail',
        templateUrl: './platform-service-detail.component.html'
    }
)
export class PlatformServiceDetailComponent implements OnInit {
    servicesSimilarObservable: Observable<any>;

    servicesIdenticalObservable: Observable<any>;

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

    @Input() serviceItem
    @Input() serviceToCompareToId: string= undefined

    public isPageRunning: boolean = true

    public state

    public clientListObservable

    public cloneForm: FormGroup    

    public stateInit() {
        if (!this.state) this.state = {};
    }

    public selectableCategoriesObservable: Observable<SelectableData[]>;
    public selectedCategoryIdsObservable: Observable<any>;

    ngOnInit(): void {
        this.stateInit()

        this.selectableCategoriesObservable = this.platformService.getSelectableCategories();
        this.selectedCategoryIdsObservable = Observable.from([this.serviceItem.data.categoryIds || []])
        
        
        this.servicesIdenticalObservable= this.platformService.getAnnotatedServicesIdenticalTo(this.serviceItem.data._id)
        this.servicesSimilarObservable= this.platformService.getAnnotatedServicesSimilarTo(this.serviceItem.data._id)

        this.clientListObservable = this.dataStore.getDataObservable('platform.client.types').takeWhile(() => this.isPageRunning).map(clientTypes => clientTypes.map(ct => {
            return {
                id: ct._id,
                name: ct.name
            }
        }));
        
        this.cloneForm = this.formBuilder.group({
            nameOfService: ['', [Validators.required, Validators.minLength(3)]],
            description: ['']
        })            
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    nameServiceUpdated(name, serviceItem) {
        serviceItem.data.name = name
        this.dataStore.updateData('platform.services', serviceItem.data._id, serviceItem.data)
    }

    descriptionServiceUpdated(description, serviceItem) {
        serviceItem.data.description = description
        this.dataStore.updateData('platform.services', serviceItem.data._id, serviceItem.data)
    }

    clientTypeChanged(typeid, serviceItem) {
        serviceItem.data.clientTypeId = typeid
        this.dataStore.updateData('platform.services', serviceItem.data._id, serviceItem.data)        
    }

    cloneService(service, formValue, isValid) {
        if (!isValid) return
        this.platformService.cloneService(service.data._id, formValue.nameOfService, formValue.description).subscribe(res => {
            this.resetCloneForm()
        })
    }

    resetCloneForm() {
        this.cloneForm.reset()
    }

     categorySelectionChanged(selectedIds: string[]) {
        this.serviceItem.data.categoryIds = selectedIds;
        this.dataStore.updateData('platform.services', this.serviceItem.data._id, this.serviceItem.data);
    }

    categoryHasBeenAdded(newCategory: string) {
        this.platformService.createCategory(newCategory);
    }

    getCostByClientTypeId(typeId) {
        if (!this.serviceItem.annotation.costMapByClientType) return 0
        var x= this.serviceItem.annotation.costMapByClientType.filter(ct => ct[0]===typeId)[0]
        if (!x) return 0

        return +x[1]
    }

    enableDisableService(isDisabled: boolean) {
        this.serviceItem.data.isDisabled = isDisabled
        this.dataStore.updateData('platform.services', this.serviceItem.data._id, this.serviceItem.data);
    }
    
}