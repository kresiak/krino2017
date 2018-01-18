import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { ProductService } from './../Shared/Services/product.service'
import { BasketService } from './../Shared/Services/basket.service'
import { ConfigService } from './../Shared/Services/config.service'
import { NotificationService } from './../Shared/Services/notification.service'
import { DataStore } from './../Shared/Services/data.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import * as reportsUtils from './../Shared/Utils/reports'
import * as dateUtils from './../Shared/Utils/dates'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-product-list',
        templateUrl: './product-list.component.html'
    }
)
export class ProductListComponent implements OnInit {
    @Input() productsObservable: Observable<any>;
    @Input() config;
    @Input() state;
    @Input() path: string = 'products'
    @Input() isForSelection: boolean = false
    @Input() selectedProductIds: string[] = []

    @Output() stateChanged = new EventEmitter();
    @Output() productsSelected = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    public products;

    constructor(private dataStore: DataStore, private authService: AuthService, private productService: ProductService, private basketService: BasketService,
        private configService: ConfigService, private notificationService: NotificationService) {
    }

    public authorizationStatusInfo: AuthenticationStatusInfo

    public basketPorductsMap: Map<string, any> = new Map<string, any>()

    public logHistory(product, event: string, oldValue, newValue) {
        if (!product.data.history) product.data.history = []
        product.data.history.push({
            date: dateUtils.nowFormated(),
            userId: this.authorizationStatusInfo.getCurrentUserName(),
            event: event,
            oldValue: oldValue,
            newValue: newValue
        })
    }

    getFilterFn() {
        var self = this
        return this.productService.getIsProductOKForListFn(self)
    }

    ngOnInit(): void {
        this.selectedProductIdsMap = new Set(this.selectedProductIds)
        this.stateInit();

        this.basketService.getBasketProductsSetForCurrentUser().subscribe(basketPorductsMap => {
            this.basketPorductsMap = basketPorductsMap
            this.productService.setBasketInformationOnProducts(this.basketPorductsMap, this.products)
        })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    setProducts(products) {
        this.products = products
        if (this.basketPorductsMap)
            this.productService.setBasketInformationOnProducts(this.basketPorductsMap, this.products)
    }

    isProductReadOnly(product) {
        return !this.authorizationStatusInfo || !this.authorizationStatusInfo.isRightAdministrator(product.annotation.isPublic)
    }


    public isPageRunning: boolean = true
    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    getProductObservable(id: string) {
        return this.productsObservable.map(products => products.filter(product => product.data._id === id)[0]);
    }

    showColumn(columnName: string) {
        return !this.config || !this.config['skip'] || !(this.config['skip'] instanceof Array) || !this.config['skip'].includes(columnName);
    }

    // This is typically used for accordions with ngFor, for remembering the open Accordion Panel (see template as well)    
    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
            this.stateChanged.next(this.state);
        }
    };

    // This is typically used for accordions with ngFor and tabsets in the cild component. As the ngFor disposes and recreates the child component, we need a way to remember the opened tab
    public childStateChanged(newState, objectId) {
        this.state[objectId] = newState;
        this.stateChanged.next(this.state);
    }

    public saveFrigoProperty(event, product, isFrigo: boolean) {
        event.preventDefault()
        event.stopPropagation()

        this.notificationService.checkForConfirmation(isFrigo ? 'PRODUCT.HELP.SET FRIDGE IN MODAL' : 'PRODUCT.HELP.UNSET FRIDGE IN MODAL', () => {
            this.logHistory(product, 'is Frigo change', product.data.isFrigo, isFrigo);
            product.data.isFrigo = isFrigo;
            this.dataStore.updateData('products', product.data._id, product.data);
        })
    }

    public selectedProductIdsMap: Set<string>

    productSelectedInList(event, product, isSelected: boolean) {
        event.preventDefault()
        event.stopPropagation()
        var id = (product.data || {})._id
        if (isSelected && this.selectedProductIdsMap.has(id)) this.selectedProductIdsMap.delete(id)
        if (!isSelected && !this.selectedProductIdsMap.has(id)) this.selectedProductIdsMap.add(id)
        this.productsSelected.next(Array.from(this.selectedProductIdsMap.values()))
    }

    isProductSelected(product) {
        return this.selectedProductIdsMap.has(product.data._id)
    }

    createReport(allProducts) {

        var fnFormat = product => {
            return {
                Name: product.data.name,
                Supplier: product.annotation.supplierName,
                Package: product.data.package,  
                CatalogNr: product.data.catalogNr,
                Price: (+product.data.price).toLocaleString('fr-BE', {useGrouping: false}),
                Frigo: product.data.isFrigo,
                Disabled: product.data.disabled,
                NbOrders: product.annotation.productFrequence
            }
        }

        var listNonDeleted = allProducts.filter(order => !order.data.disabled).map(fnFormat)
        var listDeleted = allProducts.filter(order => order.data.disabled).map(fnFormat)

        reportsUtils.generateReport(listNonDeleted.concat(listDeleted))
    }

}