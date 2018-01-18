import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { ProductService } from './../Shared/Services/product.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './category-list.routable.component.html'
    }
)
export class CategoryListComponentRoutable implements OnInit {
    constructor(private navigationService: NavigationService, private authService: AuthService, private productService: ProductService) { }

    state: {}

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    categoryObservable: Observable<any>

    ngOnInit(): void {
        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        
        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })

        this.categoryObservable = this.productService.getAnnotatedCategories();

    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionState.unsubscribe()
    }
    
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription 
    public subscriptionState: Subscription 
    
}