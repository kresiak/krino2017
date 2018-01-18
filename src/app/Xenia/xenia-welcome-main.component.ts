import { Component, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'

import { XeniaWelcomeService } from './services/welcome.service'

@Component(
    {
        templateUrl: './xenia-welcome-main.component.html'
    }
)
export class XeniaWelcomeMainComponent implements OnInit {
    public nextInfo: any = { enabled: false };
    public backInfo: any = { enabled: true };

    constructor(private welcomeService: XeniaWelcomeService) { }

    ngOnInit(): void {
        this.welcomeService.getNextObservable().takeWhile(() => this.isPageRunning).subscribe(nextInfo => {
            this.nextInfo = nextInfo
        })
        this.welcomeService.getBackObservable().takeWhile(() => this.isPageRunning).subscribe(backInfo => {
            this.backInfo = backInfo
        })

        this.welcomeService.reset()
    }

    public isPageRunning: boolean = true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    goNext() {
        if (this.nextInfo.enabled && this.nextInfo.fnExec) {
            this.nextInfo.fnExec()
        }
    }

    goBack() {
        if (this.backInfo.enabled) {
            if (this.backInfo.fnExec) { 
                this.backInfo.fnExec() 
            }
            else {
                this.welcomeService.navigateBack()
            }
        }
    }
}
