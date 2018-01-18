import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { ProductService } from '../Shared/Services/product.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './product-detail.routable.component.html'        
    }
)
export class ProductDetailComponentRoutable implements OnInit {
    constructor(private productService: ProductService, private route: ActivatedRoute, private navigationService: NavigationService, private authService: AuthService) { }

    product: any
    state: {}

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription     
    public subscriptionState: Subscription 
    public subscriptionRoute: Subscription 

    productObservable: Observable<any>;
    initData(id: string) {
        if (id) {
            this.productObservable = this.productService.getAnnotatedProductsById(id);
            this.productObservable.subscribe(obj => {
                this.product = obj
            })
        }
    }

    ngOnInit(): void {
        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        
        this.subscriptionRoute= this.route.params.subscribe((params: Params) => {
            let id = params['id'];
            this.initData(id)
        });

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        });
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionState.unsubscribe()
         this.subscriptionRoute.unsubscribe()         
    }
    
    
}
