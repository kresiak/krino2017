import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { SupplierService } from './../Shared/Services/supplier.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './basket.routable.component.html'        
    }
)
export class BasketRoutableComponent implements OnInit {
    constructor(private supplierService: SupplierService, private navigationService: NavigationService, private authService: AuthService) { }

    state: {}

    suppliersWithBasketObservable: Observable<any>;

    ngOnInit(): void {
        this.suppliersWithBasketObservable= this.supplierService.getAnnotatedSupplierseWithBasketForCurrentUser()

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
    }
    

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription 
}