import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'

@Component(
    {
        selector: 'gg-platform-offer-list',
        templateUrl: './platform-offer-list.component.html'
    }
)
export class PlatformOfferListComponent implements OnInit {

    constructor() {
    }

    public state
    @Input() offersObservable: Observable<any>

    public isPageRunning: boolean = true

    public offersList: any

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    fnFilter(o, txt) {
        if (txt === '' || txt === '$') return true
        if (txt.startsWith('$>') && +txt.slice(2)) {
            let montant = +txt.slice(2);
            return + o.annotation.total >= montant;
        }
        if (txt.startsWith('$<') && +txt.slice(2)) {
            let montant = +txt.slice(2);
            return + o.annotation.total <= montant;
        }
        return (o.data.description || '').toUpperCase().includes(txt) || (o.annotation.serviceTxt || '').toUpperCase().includes(txt) || (o.annotation.numero || '').toUpperCase().includes(txt)
            || (o.annotation.client || '').toUpperCase().includes(txt) || (o.annotation.commercialStatus || '').toUpperCase().includes(txt)
    }


    ngOnInit(): void {
        this.stateInit()
    }

    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
        }
    };

    ngOnDestroy(): void {
        this.isPageRunning = false
    }
}

