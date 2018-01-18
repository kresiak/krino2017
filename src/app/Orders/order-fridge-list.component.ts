import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from 'gg-basic-data-services';
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { NavigationService } from './../Shared/Services/navigation.service'

@Component(
    {
        selector: 'gg-order-fridge-list',
        templateUrl: './order-fridge-list.component.html'
    }
)

export class OrderFridgeListComponent implements OnInit {
    public ordersList;
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription 
    public subscriptionOrder: Subscription 
   
    constructor(private dataStore: DataStore, private authService: AuthService, private navigationService: NavigationService) {}

    @Input() fridgeOrdersObservable: Observable<any>;
    @Input() path: string
    

    ngOnInit(): void {

        this.subscriptionOrder= this.fridgeOrdersObservable.subscribe(orders => {
            this.ordersList = orders;
        });

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        });
        
    };    

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionOrder.unsubscribe()
    }
    
    orderUpdated(qtyNew, order) {
        order.data.quantity = qtyNew;
        this.dataStore.updateData('orders.fridge', order.data._id, order.data)
    };

    isDeliveredUpdated(disabled:boolean, order: any) {
        order.data.isDelivered = disabled;
        this.dataStore.updateData('orders.fridge', order.data._id, order.data);
    };

    navigateToProduct(productId) {
        this.navigationService.maximizeOrUnmaximize('/product', productId, this.path, false)
    }


};
