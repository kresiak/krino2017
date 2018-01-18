import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { ConfigService } from 'gg-basic-data-services'
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import * as moment from "moment"
import * as comparatorsUtils from './../Shared/Utils/comparators'
import * as reportsUtils from './../Shared/Utils/reports'
import * as dateUtils from './../Shared/Utils/dates'


@Component(
    {
        selector: 'gg-order-list',
        templateUrl: './order-list.component.html'
    }
)
export class OrderListComponent implements OnInit {
    allOrders: any;
    constructor(private configService: ConfigService, private authService: AuthService) {
    }

    public isPageRunning: boolean = true

    public orders

    @Input() ordersObservable: Observable<any>;
    @Input() state;
    @Input() path: string = 'orders'
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    @Input() config;

    public authorizationStatusInfo: AuthenticationStatusInfo;

    getFilterFn() {
        var self = this

        var filterOrders = function (order, txt) {
            if (txt === '' || txt === '$' || txt === '$>' || txt === '$<' || txt === '#') return !order.data.status || order.data.status.value !== 'deleted'

            if (txt.startsWith('#AD')) {
                return order.annotation.allDelivered && order.data.status.value !== 'deleted'
            }
            if (txt.startsWith('#CO')) {
                return order.data.comments && order.data.comments.length > 0
            }
            if (txt.startsWith('#ND')) {
                return !order.annotation.allDelivered && order.data.status.value !== 'deleted'
            }
            if (txt.startsWith('#ZD')) {
                return !order.annotation.allDelivered && !order.annotation.anyDelivered && order.data.status.value !== 'deleted'
            }
            if (txt.startsWith('#PD')) {
                return order.annotation.anyDelivered && !order.annotation.allDelivered && order.data.status.value !== 'deleted'
            }
            if (txt.startsWith('#NU')) {
                return order.annotation.isGroupedOrder
            }
            if (txt.startsWith('#>') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return order.data.items && order.data.items.length >= montant;
            }
            if (txt.startsWith('#')) {
                let txt2 = txt.slice(1);
                return order.annotation.items.filter(item =>
                    item.annotation.description.toUpperCase().includes(txt2) || item.annotation.catalogNr.toUpperCase().includes(txt2)).length > 0;
            }
            if (txt.startsWith('$>') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return + order.annotation.total >= montant;
            }
            if (txt.startsWith('$<') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return + order.annotation.total <= montant;
            }
            return order.annotation.user.toUpperCase().includes(txt)
                || order.annotation.supplier.toUpperCase().includes(txt)
                || (self.authorizationStatusInfo && self.authorizationStatusInfo.isProgrammer() && order.data._id.toUpperCase().includes(txt))
                || (order.annotation.equipe && order.annotation.equipe.toUpperCase().includes(txt))
                || order.annotation.status.toUpperCase().includes(txt)
                || (order.data.kid || '').toString().includes(txt) || (order.annotation.sapId || '').toString().includes(txt);

        }
        return filterOrders
    }

    calculateTotal(orders): number {
        return orders.filter(order => !order.annotation.status.toUpperCase().includes('DELETED')).reduce((acc, order) => acc + order.annotation.total, 0)
    }

    ngOnInit(): void {
        this.stateInit();

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    createReport(allOrders) {

        var fnFormat = order => {
            return {
                'Krino id': order.data.kid,
                'Sap id': order.annotation.sapId,
                Date: dateUtils.formatLongDate(order.data.date),
                User: order.annotation.user,
                Equipe: order.annotation.equipe ? order.annotation.equipe : (order.annotation.equipeGroup ? order.annotation.equipeGroup : 'unknown equipe'),
                Supplier: order.annotation.supplier,
                'With VAT': order.annotation.total.toLocaleString('fr-BE', {useGrouping: false}), 
                Status: order.annotation.status
            }
        }

        var listNonDeleted = allOrders.filter(order => order.data.status.value !== 'deleted').map(fnFormat)
        var listDeleted = allOrders.filter(order => order.data.status.value === 'deleted').map(fnFormat)



        reportsUtils.generateReport(listNonDeleted.concat(listDeleted))
    }

    getOrderObservable(id: string): Observable<any> {
        return this.ordersObservable.map(orders => orders.filter(s => s.data._id === id)[0]);
    }

    formatDate(date: string): string {
        var now = moment()
        var then = moment(date, 'DD/MM/YYYY HH:mm:ss')
        var diff = now.diff(then, 'days');

        //var md= moment(date, 'DD/MM/YYYY HH:mm:ss').fromNow()
        return diff < 15 ? then.fromNow() : then.format('LLLL')
    }

    showColumn(columnName: string) {
        return !this.config || !this.config['skip'] || !(this.config['skip'] instanceof Array) || !this.config['skip'].includes(columnName);
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

    public sortFnObservable: BehaviorSubject<any> = new BehaviorSubject<any>(undefined)
    public sortKey: string= undefined

    public setSortKey(sortKey) {
        this.sortKey = sortKey === this.sortKey ? undefined : sortKey
        var fn: any

        if (!this.sortKey) {
            fn= undefined
        }
        else if (this.sortKey === 'SUPPLIER') {
            fn= (a, b) => a.annotation.supplier <= b.annotation.supplier ? -1 : 1
        }

        this.sortFnObservable.next(fn)
    }

}

