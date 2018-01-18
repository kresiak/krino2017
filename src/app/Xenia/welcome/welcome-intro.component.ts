import { Component, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'

import { XeniaWelcomeService } from '../services/welcome.service'

@Component(
    {
        templateUrl: './welcome-intro.component.html'
    }
)
export class XeniaWelcomeIntroComponent implements OnInit {
    constructor(private welcomeService: XeniaWelcomeService) { }

    ngOnInit(): void {
        this.welcomeService.nextEnable(() => {
            this.welcomeService.navigateTo('name')
        })
        this.welcomeService.backDisable()
    }

    public isPageRunning: boolean = true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

}
