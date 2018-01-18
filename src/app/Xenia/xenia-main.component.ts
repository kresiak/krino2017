import { Component, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        templateUrl: './xenia-main.component.html'
    }
)
export class XeniaMainComponent implements OnInit {
    constructor() { }

    ngOnInit(): void {
    }

    public isPageRunning: boolean= true

    ngOnDestroy(): void {
        this.isPageRunning= false
    }

}
