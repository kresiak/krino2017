import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { OrderService } from './../Shared/Services/order.service'
import { StockService } from '../Shared/Services/stock.service';
import { NavigationService } from './../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

import * as utilsdate from './../Shared/Utils/dates'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-stock-detail',
        templateUrl: './stock-detail.component.html'
    }
)
export class StockDetailComponent implements OnInit {
    constructor(private authService: AuthService, private orderService: OrderService, private dataStore: DataStore, private formBuilder: FormBuilder) {

    }

    @Input() productObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() initialTab: string = '';
    @Output() stateChanged = new EventEmitter();

    public stockProducts;

    public manualQuantityForm: FormGroup;

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initialTab;
    }

    public isPageRunning: boolean = true
    public authorizationStatusInfo: AuthenticationStatusInfo;

    public getUserName
    public getOrderId

    ngOnInit(): void {
        this.stateInit();

        this.manualQuantityForm = this.formBuilder.group({
            comment: ['', [Validators.required, Validators.minLength(5)]],
            quantityIncrement: ['', Validators.required],
        });


        this.productObservable.takeWhile(() => this.isPageRunning).subscribe(product => {
            this.stockProducts = product ? product.values : [];
        });

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.authService.getAnnotatedUsersHashmap().takeWhile(() => this.isPageRunning).subscribe(usersMap => {
            this.getUserName = userId => usersMap.get(userId).annotation.fullName
        })

        this.orderService.getKrinoIdLightMap().takeWhile(() => this.isPageRunning).subscribe(orderIdMap => {
            this.getOrderId = orderId => orderIdMap.get(orderId).kid
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    public beforeTabChange($event: NgbTabChangeEvent) {
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    deteteHistoryItem(stockProduct, historyItem) {
        var pos = stockProduct.data.history.indexOf(historyItem)
        if (pos >= 0) stockProduct.data.history.splice(pos, 1)
        this.dataStore.updateData('products.stock', stockProduct.data._id, stockProduct.data);
    }

    stockQuantitySaved(stockProduct, qty) {
        stockProduct.data.quantity = qty
        this.dataStore.updateData('products.stock', stockProduct.data._id, stockProduct.data);
    }

    saveQuantityForm(stockProduct, formValue, isValid) {
        if (! +formValue.quantityIncrement) return
        if (!stockProduct.data.manualChanges) stockProduct.data.manualChanges= []
        var x= {         
            comment: formValue.comment,
            quantity: +formValue.quantityIncrement,
            date: utilsdate.nowFormated(),
            userId: this.authorizationStatusInfo.currentUserId
        }
        stockProduct.data.manualChanges.push(x)
        stockProduct.data.quantity += +formValue.quantityIncrement
        this.dataStore.updateData('products.stock', stockProduct.data._id, stockProduct.data);
    }

    resetForm() {
        this.manualQuantityForm.reset();
    }

    hasManualChanges() : boolean {
        return this.stockProducts.filter(sp => (sp.data.manualChanges || []).length > 0).length > 0
    }
}