import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';


@Component(
    {
        //moduleId: module.id,
        selector: 'gg-stock-order-list',
        templateUrl: './stock-order-list.component.html'
    }
)
export class StockOrderListComponent implements OnInit {
    constructor() {
    }

    public isPageRunning: boolean = true

    public orders; //: Observable<any>;
    @Input() ordersObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    fnFilterOrder(order, txt) {
        return (order.annotation.user && order.annotation.user.toUpperCase().includes(txt)) ||
            (order.annotation.product && order.annotation.product.toUpperCase().includes(txt)) ||
            (order.annotation.equipe && order.annotation.equipe.toUpperCase().includes(txt)) ||
            (order.annotation.catalogNr && order.annotation.catalogNr.toUpperCase().includes(txt))
    }

    ngOnInit(): void {
        this.stateInit();
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getOrderObservable(id: string): Observable<any> {
        return this.ordersObservable.map(orders => {
            let order = orders.filter(s => s.data._id === id)[0];
            return order;
        });
    }

    // This is typically used for accordions with ngFor, for remembering the open Accordion Panel (see template as well)
    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
            this.stateChanged.next(this.state);
        }
    };

    // This is typically used for accordions with ngFor and tabsets in the cild component. As the ngFor disposes and recreates the child component, we need a way to remember the opened tab
    public childStateChanged(newState, objectId) {
        this.state[objectId] = newState;
        this.stateChanged.next(this.state);
    }

}

