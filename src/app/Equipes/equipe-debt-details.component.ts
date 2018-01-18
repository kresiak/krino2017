import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-equipe-debt-details',
        templateUrl: './equipe-debt-details.component.html'        
    }
)
export class EquipeDebtDetailsComponent implements OnInit {
    constructor() { }

    @Input() list: any[]

    ngOnInit(): void {
    }
    
    ngOnDestroy(): void {
    }
    
    
}
