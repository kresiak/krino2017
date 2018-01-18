import { Component, OnInit, Input, Output } from '@angular/core'
import { SupplierService } from './../Shared/Services/supplier.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'


@Component(
    {
        //moduleId: module.id,
        templateUrl: './supplier-list.routable.component.html'        
    }
)
export class SupplierListComponentRoutable implements OnInit {
    constructor(private supplierService: SupplierService, private navigationService: NavigationService, private authService: AuthService) { }

    state: {}

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    ngOnInit(): void {
        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        
        this.suppliersObservable = this.supplierService.getAnnotatedSuppliersByFrequence();
        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })

    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionState.unsubscribe()
    }
    
    public suppliersObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription     
    public subscriptionState: Subscription 
    
}

