import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx'
import { EquipeService } from '../Shared/Services/equipe.service';
import { OtpService } from '../Shared/Services/otp.service'
import { ProductService } from '../Shared/Services/product.service'
import { SapService } from './../Shared/Services/sap.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { DataStore } from 'gg-basic-data-services'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import {utilsComparators as comparatorsUtils} from 'gg-basic-code'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './otp-list.routable.component.html'
    }
)
export class OtpListComponentRoutable implements OnInit {
    nbExpiringOtps: number= 0;
    constructor(private equipeService: EquipeService, private navigationService: NavigationService, private authService: AuthService, private sapService: SapService, private otpService: OtpService,
        private dataStore: DataStore, private productService: ProductService) { }

    private isPageRunning: boolean = true
    
    state: {}
    equipesObservable: Observable<any>;
    otpsObservableExpiring: Observable<any>;

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    ngOnInit(): void {
        this.navigationService.getStateObservable().takeWhile(() => this.isPageRunning).subscribe(state => {
            this.state = state
        })
        this.otpsObservable = this.otpService.getAnnotatedOtps();

        this.otpsObservableExpiring = this.otpService.getAnnotatedFinishingOtps();
        this.equipesObservable = this.equipeService.getAnnotatedEquipes();
        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.otpsObservableExpiring.takeWhile(() => this.isPageRunning).subscribe(otps => {
            this.nbExpiringOtps= otps ? otps.length : 0
        })
    }


    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    public otpsObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo;
}

