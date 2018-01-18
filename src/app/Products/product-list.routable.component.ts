import { Component, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { ProductService } from './../Shared/Services/product.service'
import { SupplierService } from './../Shared/Services/supplier.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './product-list.routable.component.html'
    }
)
export class ProductListComponentRoutable implements OnInit {
    productsPrivateObservable: Observable<any>;
    constructor(private productService: ProductService, private supplierService: SupplierService, private navigationService: NavigationService, private authService: AuthService) { }

    state: {}
    public subscriptionAuthorization: Subscription


    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    ngOnInit(): void {
        this.productsObservable = this.productService.getAnnotatedProductsAll();
        this.productsPrivateObservable = this.productService.getAnnotatedPrivateProducts();
        this.suppliersObservable = this.supplierService.getAnnotatedSuppliersByFrequence();
        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
        this.subscriptionState = this.navigationService.getStateObservable().subscribe(state => {
            this.state = state
        })
    }

    ngOnDestroy(): void {
        this.subscriptionAuthorization.unsubscribe()
        this.subscriptionState.unsubscribe()
    }


    public productsObservable: Observable<any>;
    public suppliersObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionState: Subscription


}
