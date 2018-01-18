import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        selector: 'gg-platform-main',
        templateUrl: './platform-main-component.html'
    }
)
export class PlatformMainComponent implements OnInit {
    isPageRunning: boolean= true;

    constructor(private authService: AuthService) {
    }
    ngOnInit(): void {

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public authorizationStatusInfo: AuthenticationStatusInfo;
}