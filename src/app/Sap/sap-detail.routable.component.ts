import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { SapService } from '../Shared/Services/sap.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        templateUrl: './sap-detail.routable.component.html'        
    }
)
export class SapComponentRoutable implements OnInit {
    constructor(private sapService: SapService, private route: ActivatedRoute, private navigationService: NavigationService, private authService: AuthService) { }

    sapItem: any= undefined
    state: {}

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription 
    public subscriptionState: Subscription 
    public subscriptionRoute: Subscription 

    sapObservable: Observable<any>;
    initData(id: string) {
        if (id) {
            this.sapObservable = this.sapService.getSapIdMapObservable().map(map => 
            {
                let x= map
                return map.has(+id) ? map.get(+id) : null}
            );
            this.sapObservable.subscribe(res => { 
                if (res) this.sapItem= res.mainData
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
