import { Component, OnInit, Input, Output } from '@angular/core'
import { SupplierService } from './../Shared/Services/supplier.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { ProductService } from './../Shared/Services/product.service'
import { StockService } from '../Shared/Services/stock.service';

import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'


@Component(
    {
        //moduleId: module.id,
        templateUrl: './stock.routable.component.html'        
    }
)
export class StockComponentRoutable implements OnInit {
    constructor(private stockService: StockService, private navigationService: NavigationService, private authService: AuthService, private route: ActivatedRoute) { }

    state
    initTabId= ''

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initTabId;
    }

    ngOnInit(): void {
        this.stateInit()
        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        

        this.productsObservable = this.stockService.getAnnotatedStockProductsAll();
        this.ordersObservable = this.stockService.getAnnotatedStockOrdersAll()

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })

        this.route.queryParams.first().subscribe(queryParams => {
            this.initTabId = queryParams['tab'];
        })     

    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionState.unsubscribe()
    }
        

    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription     
    public subscriptionState: Subscription 
    public productsObservable: Observable<any>;
    public ordersObservable: Observable<any>;
}

