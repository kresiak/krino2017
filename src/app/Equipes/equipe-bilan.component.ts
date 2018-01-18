import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'

@Component({
        selector: 'gg-equipe-bilan',
        templateUrl: './equipe-bilan.component.html'
})
export class EquipeBilanComponent implements OnInit {

    constructor() {

    }

    @Input() bilanObservable: Observable<any>
    public bilan     
    public subscription: Subscription

    ngOnInit():void {
        this.subscription= this.bilanObservable.subscribe(b => {
            this.bilan=  b
        })
    }

    ngOnDestroy(): void {
         this.subscription.unsubscribe()
    }
}

