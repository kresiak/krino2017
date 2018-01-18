import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './user-list.routable.component.html'
    }
)
export class UserListComponentRoutable implements OnInit {
    constructor(private navigationService: NavigationService, private authService: AuthService) { }

    usersObservable: Observable<any>;
    adminsObservable: Observable<any>;
    currentUserObservable: Observable<any>;

    state: {}

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }


    ngOnInit(): void {
        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        
        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })

        this.usersObservable = this.authService.getAnnotatedUsers();
        this.adminsObservable = this.authService.getAnnotatedAdminUsers();
        this.currentUserObservable = this.authService.getAnnotatedCurrentUser();
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionState.unsubscribe()         
    }
    
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription 
    public subscriptionState: Subscription 
        
}