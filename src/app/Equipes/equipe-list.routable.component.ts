import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, Inject } from '@angular/core'
import { NavigationService } from '../Shared/Services/navigation.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { EquipeService } from '../Shared/Services/equipe.service';

@Component(
    {
        //moduleId: module.id,
        templateUrl: './equipe-list.routable.component.html'        
    }
)
export class EquipeListComponentRoutable implements OnInit, AfterViewInit {
    
    constructor(private navigationService: NavigationService, private authService: AuthService, private equipeService: EquipeService) { 

    }

    state: {}
    equipesObservable: Observable<any>;
    equipeObservable: Observable<any>;

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

        this.equipesObservable = this.equipeService.getAnnotatedEquipes();
        this.annotatedGiftsObservable= this.equipeService.getAnnotatedEquipesGifts()

        this.equipeObservable = this.equipeService.getAnnotatedCurrentEquipe()
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionState.unsubscribe()
    }
    

    public annotatedGiftsObservable: Observable<any>

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription 
    public subscriptionState: Subscription 
    
}