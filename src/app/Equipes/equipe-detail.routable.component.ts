import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { EquipeService } from '../Shared/Services/equipe.service';
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './equipe-detail.routable.component.html'        
    }
)
export class EquipeDetailComponentRoutable implements OnInit {
    constructor(private equipeService: EquipeService, private route: ActivatedRoute, private navigationService: NavigationService, private authService: AuthService) { }

    equipe: any
    state: {}

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription 
    public subscriptionState: Subscription 
    public subscriptionRoute: Subscription 
    

    equipeObservable: Observable<any>;
    initData(id: string) {
        if (id) {
            this.equipeObservable = this.equipeService.getAnnotatedEquipeById(id);
            this.equipeObservable.subscribe(obj => {
                this.equipe = obj
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
