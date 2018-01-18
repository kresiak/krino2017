import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { AuthAnoynmousService, SignedInStatusInfo } from './../Shared/Services/auth-anonymous.service'

@Component(
    {
        selector: 'gg-public-main',
        templateUrl: './public-main-component.html'
    }
)
export class PublicMainComponent implements OnInit {
    authorizationStatusInfo: SignedInStatusInfo;
    isPageRunning: boolean= true;

    constructor(private authAnoynmousService: AuthAnoynmousService) {
    }

    ngOnInit(): void {
        this.authAnoynmousService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    loginHasBeenTried(data) {
        this.authAnoynmousService.tryLogin(data.user, data.password)
    }

    
}