import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthService } from './../Shared/Services/auth.service'
import { NavigationService } from './../Shared/Services/navigation.service'
import { DataStore } from 'gg-basic-data-services'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import * as dateUtils from './../Shared/Utils/dates'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-stock-product-enter',
        templateUrl: './stock-product-order.component.html'
    }
)
export class StockProductEnterComponent implements OnInit {
    constructor(private authService: AuthService, private navigationService: NavigationService, private dataStore: DataStore, private formBuilder: FormBuilder) {

    }

    public product;
    public frmStockOrder: FormGroup;

    @Input() productObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    

    formStockInit() {

        this.frmStockOrder= this.formBuilder.group({
            quantity: [0]            
        });
    }

    subscriptionProduct: Subscription

    ngOnInit(): void {
        this.formStockInit();

        this.subscriptionProduct= this.productObservable.subscribe(product => {
            this.product = product;
        });
    }

    ngOnDestroy(): void {
         this.subscriptionProduct.unsubscribe()
    }


    save(formValue, isValid) {
        if (! +formValue.quantity) return

        let data= {
            userId : this.authService.getUserId(),
            equipeId : this.authService.getEquipeId(),
            productId : this.product.key,
            date: dateUtils.nowFormated(),
            quantity: +formValue.quantity > this.getNbOrderable() ? this.getNbOrderable() : +formValue.quantity
        }
        this.product.values[0].annotation.nbReservedByMe += +formValue.quantity

        if (data.quantity >= 1) this.dataStore.addData('orders.stock', data);
    }

    getNbAvailable() {
        return this.product.values.reduce((acc, b)=> acc + b.annotation.nbAvailable, 0) 
    }

    getNbOrderable() {
        return this.getNbAvailable()-this.product.values[0].annotation.nbReservedByMe
    }

    navigateToProduct() {
        this.navigationService.maximizeOrUnmaximize('/product', this.product.key, this.path, false)
    }
    
}