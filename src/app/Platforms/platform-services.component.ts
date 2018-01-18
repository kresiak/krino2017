import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { PlatformService } from './../Shared/Services/platform.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectableData } from './../Shared/Classes/selectable-data'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-platform-services',
        templateUrl: './platform-services.component.html'
    }
)
export class PlatformServicesComponent implements OnInit {
    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

    public serviceForm: FormGroup

    @ViewChild('categoriesSelector') categoriesChild;

    public isPageRunning: boolean = true

    public state
    public categoryIdObservable
    public categoryForm: FormGroup
    public categoryList = []

    public servicesObservable: Observable<any>

    public selectableCategoriesObservable: Observable<SelectableData[]>;

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }


    ngOnInit(): void {
        this.stateInit()

        this.selectableCategoriesObservable = this.platformService.getSelectableCategories();

        this.serviceForm = this.formBuilder.group({
            nameOfService: ['', [Validators.required, Validators.minLength(3)]],
            description: ['']
        })

        this.servicesObservable = this.platformService.getAnnotatedServices()

        this.categoryForm = this.formBuilder.group({
            nameOfCategory: ['', [Validators.required, Validators.minLength(3)]],
            description: ['']
        })

        this.dataStore.getDataObservable('platform.service.categories').takeWhile(() => this.isPageRunning).subscribe(category => {
            if (!comparatorsUtils.softCopy(this.categoryList, category))
                this.categoryList = comparatorsUtils.clone(category)
        })

        this.categoryIdObservable = this.dataStore.getDataObservable('platform.service.categories').takeWhile(() => this.isPageRunning).map(categories => categories.map(categoryId => {
            return {
                id: categoryId._id,
                name: categoryId.name
            }
        }))

    }

    addService(formValue, isValid) {
        if (!isValid) return
        this.dataStore.addData('platform.services', {
            name: formValue.nameOfService,
            description: formValue.description,
            categoryIds: this.selectedIds
        }).subscribe(res => {
            this.reset()
        })
    }

    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
        }
    };

    public beforeTabChange() {
        this.state.openPanelId = ''
    };


    reset() {
        this.serviceForm.reset()
        this.categoriesChild.emptyContent()
    }

    saveCategoryForm(formValue, isValid) {
        this.dataStore.addData('platform.service.categories', {
            name: formValue.nameOfCategory,
            description: formValue.description
        }).subscribe(res => {
            this.resetCategoryForm()
        })
    }

    resetCategoryForm() {
        this.categoryForm.reset()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    nameServiceCategoryUpdated(name, categoryItem) {
        categoryItem.name = name
        this.dataStore.updateData('platform.service.categories', categoryItem._id, categoryItem)
    }

    descriptionServiceCategoryUpdated(description, categoryItem) {
        categoryItem.description = description
        this.dataStore.updateData('platform.service.categories', categoryItem._id, categoryItem)
    }

    getServiceObservableByCategory(catId: string) {
        return this.platformService.getAnnotatedServices().map(services => services.filter(service => (service.data.categoryIds || []).includes(catId)))
    }

    public selectedIds;

    categorySelectionChanged(selectedIds: string[]) {
        this.selectedIds = selectedIds;
    }

    categoryHasBeenAdded(newCategory: string) {
        this.platformService.createCategory(newCategory);
    }
}