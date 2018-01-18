import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './user-detail.routable.component.html'
    }
)
export class UserDetailComponentRoutable implements OnInit {
    constructor(private route: ActivatedRoute, private navigationService: NavigationService, private authService: AuthService) { }

    user: any
    state: {}

    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription    
    public subscriptionState: Subscription 
    public subscriptionRoute: Subscription 
     

    userObservable: Observable<any>;
    initData(id: string) {
        if (id) {
            this.userObservable = this.authService.getAnnotatedUserById(id);
            this.userObservable.subscribe(obj => {
                this.user = obj
            })
        }
    }

    ngOnInit(): void {
        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        

        this.subscriptionRoute= this.subscriptionRoute= this.route.params.subscribe((params: Params) => {
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
