import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from './../Shared/Services/product.service'
import { StockService } from '../Shared/Services/stock.service';
import { NavigationService } from './../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import * as moment from "moment"
import {utilsDates as dateUtils} from 'gg-basic-code'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-stock-order-detail',
        templateUrl: './stock-order-detail.component.html'
    }
)
export class StockOrderDetailComponent implements OnInit {
    constructor(private authService: AuthService, private navigationService: NavigationService, private dataStore: DataStore, private stockService: StockService) {

    }

    public order;
    public stockItems: any[];
    public frmStockOrder: FormGroup;
    @Input() orderObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() initialTab: string = '';
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initialTab;
    }

    formStockInit(stockItems) {
        this.frmStockOrder = new FormGroup({});
        stockItems.forEach(item => {    // here item is as item in products.stock collection
            this.frmStockOrder.addControl(item.data._id, new FormControl('0'));
        });        
    }

    public subscriptionOrder: Subscription
    public stockItemsObservable: Observable<any>
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription     

    ngOnInit(): void {
        this.stateInit();

        this.subscriptionOrder= this.orderObservable.subscribe(order => {
            this.order = order;
            if (order) {
                this.stockItemsObservable= this.stockService.getAnnotatedAvailableStockProductsByProduct(order.data.productId)
                this.stockItemsObservable.first().subscribe(stockItems =>{
                    this.stockItems= stockItems
                    this.formStockInit(stockItems)
                })
            }                
        });

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })
        
    }

    ngOnDestroy(): void {
         this.subscriptionOrder.unsubscribe()
         this.subscriptionAuthorization.unsubscribe()
    }

    public isProcessFormOK: boolean= true
    public isBlocked: boolean= false

    save(formValue: Object, isValid) {
        if (this.isBlocked) return
        this.isBlocked= true
        let nbTotal= Object.keys(formValue).map(key => +formValue[key]).reduce((a, b) => a+b, 0)
        this.isProcessFormOK= nbTotal > 0
        if (!this.isProcessFormOK) return
        let userId = this.order.data.userId;
        let equipeId = this.order.data.equipeId;
        let now = dateUtils.nowFormated()
        this.order.data.stockItemIds= []
        this.stockItems.forEach(stockItem => {
            if (formValue[stockItem.data._id] && +formValue[stockItem.data._id] > 0) {
                this.order.data.stockItemIds.push(stockItem.data._id)
                if (!stockItem.data.sales) stockItem.data.sales = [];
                stockItem.data.sales.push({
                    quantity: +formValue[stockItem.data._id],
                    userId: userId,
                    equipeId: equipeId,
                    stockOrderId: this.order.data._id,
                    date: now
                });
                this.dataStore.updateData('products.stock', stockItem.data._id, stockItem.data);
            }
        });
        this.order.data.isProcessed= true
        this.dataStore.updateData('orders.stock', this.order.data._id, this.order.data);
    }

    public beforeTabChange($event: NgbTabChangeEvent) {
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    navigateToProduct() {
        this.navigationService.maximizeOrUnmaximize('/product', this.order.data.productId, this.path, false)
    }
    

    deleteOrder()  {
        if (this.isBlocked) return
        this.isBlocked= true        
        this.dataStore.deleteData('orders.stock', this.order.data._id)
    }
}