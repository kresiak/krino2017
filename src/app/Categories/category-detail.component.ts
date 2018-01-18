import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { OtpService } from './../Shared/Services/otp.service'
import { ConfigService } from 'gg-basic-data-services'
import { ProductService } from './../Shared/Services/product.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import { NavigationService } from './../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { SelectableData } from './../Shared/Classes/selectable-data'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-category-detail',
        templateUrl: './category-detail.component.html'
    }
)

export class CategoryDetailComponent implements OnInit {
    selectedClassificationsObservable: any;
    selectableClassificationsObservable: Observable<SelectableData[]>;
    classificationObservable: Observable<any>;
    constructor(private dataStore: DataStore, private productService: ProductService, private otpService: OtpService, private navigationService: NavigationService,
        private authService: AuthService, private configService: ConfigService) {
    }

    public subscriptionAuthorization: Subscription
    public subscriptionCategory: Subscription

    @Input() categoryObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false
    @Output() stateChanged = new EventEmitter()

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = '';
    }

    ngOnInit(): void {
        this.stateInit();

        this.subscriptionCategory = this.categoryObservable.subscribe(category => {
            this.category = category;
            if (category) {
                this.productsObservable = this.productService.getAnnotatedProductsByCategory(category.data._id)
                this.otpsObservable = this.otpService.getAnnotatedOpenOtpsByCategory(category.data._id)
                this.classificationObservable = this.otpService.getAnnotatedClassifications().map(classifications => classifications.filter(c => (c.data.categoryIds || []).includes(category.data._id)))
                this.selectedClassificationsObservable = this.classificationObservable.map(classifications => classifications.map(c => c.data._id))
            }
        });
        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });

        this.selectableClassificationsObservable = this.otpService.getSelectableClassifications();

    }

    ngOnDestroy(): void {
        this.subscriptionAuthorization.unsubscribe()
        this.subscriptionCategory.unsubscribe()
    }

    //private model;
    public category
    public productsObservable: Observable<any>
    public otpsObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo;

    public beforeTabChange($event: NgbTabChangeEvent) {
        if ($event.nextId === 'tabMax') {
            $event.preventDefault();
            this.navigationService.maximizeOrUnmaximize('/category', this.category.data._id, this.path, this.isRoot)
            return
        }
        if ($event.nextId === 'gotoTop') {
            $event.preventDefault();
            this.navigationService.jumpToTop()
            return
        }

        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public childProductsStateChanged($event) {
        this.state.Products = $event;
        this.stateChanged.next(this.state);
    }

    public childOtpsStateChanged($event) {
        this.state.Otps = $event;
        this.stateChanged.next(this.state);
    }

    blockedUpdated(isBlocked) {
        if (!isBlocked) {
            this.category.data.isBlocked = false;
            this.dataStore.updateData('categories', this.category.data._id, this.category.data);
            return
        }

        this.productService.getAnnotatedProductsByCategory(this.category.data._id).first().subscribe(products => {
            if ((!products || products.length === 0) && !this.category.annotation.classificationsTxt) {
                this.dataStore.deleteData('categories', this.category.data._id)
            }
            else {
                this.category.data.isBlocked = true;
                this.dataStore.updateData('categories', this.category.data._id, this.category.data);
            }
        })
    }

    isOfficUpdated(isOffices) {
        this.category.data.isOffice = isOffices;
        this.dataStore.updateData('categories', this.category.data._id, this.category.data);
    }

    nameCatUpdated(nameCat: string) {
        this.category.data.name = nameCat;
        this.dataStore.updateData('categories', this.category.data._id, this.category.data);
    }

    noArticleUpdated(noArt: string) {
        this.category.data.noArticle = noArt;
        this.dataStore.updateData('categories', this.category.data._id, this.category.data);
    }

    groupMUpdated(grMarch: string) {
        this.category.data.groupMarch = grMarch;
        this.dataStore.updateData('categories', this.category.data._id, this.category.data);
    }

    classificationSelectionChanged(selectedIds) {
        this.dataStore.reverseFKUpdate('otp.product.classifications', 'categoryIds', selectedIds, this.category.data._id)
    }
}