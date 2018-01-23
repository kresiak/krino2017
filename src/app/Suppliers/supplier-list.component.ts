import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { SupplierService } from './../Shared/Services/supplier.service'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'

@Component(
    {
        selector: 'gg-supplier-list',
        templateUrl: './supplier-list.component.html'
    }
)
export class SupplierListComponent implements OnInit {
    constructor(private supplierService: SupplierService) {
    }

    public suppliers = []; //: Observable<any>;
    @Input() suppliersObservable: Observable<any>;
    @Input() state;
    @Input() path: string = 'suppliers'
    @Input() initialTabInSupplierDetail: string = '';
    @Output() stateChanged = new EventEmitter();


    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    public supplierIdsSetWithBasketForCurrentUser: Set<string> = new Set<string>()

    public isPageRunning: boolean = true

    setBasketInformation() {
        if (!this.supplierIdsSetWithBasketForCurrentUser) return
        this.suppliers.forEach(supplier => {
            supplier.annotation.hasBasket = this.supplierIdsSetWithBasketForCurrentUser.has(supplier.data._id)
        })
    }

    filterSuppliers = function (supplier, txt) {   // check that there is no use of this. here... 
        if (txt === '' || txt === '$') return !supplier.data.disabled

        if (txt.toUpperCase().startsWith('$W')) {
            return supplier.data.webShopping && supplier.data.webShopping.isEnabled
        }

        if (txt.startsWith('$DO')) {
            return supplier.data.documents && supplier.data.documents.length > 0
        }

        if (txt.startsWith('$DI')) {
            return supplier.data.disabled;
        }

        if (txt.toUpperCase().startsWith('$C')) {
            return supplier.annotation.nbFixCosts > 0
        }

        if (txt.toUpperCase().startsWith('$E')) {
            return supplier.data.isEproc
        }

        if (txt.toUpperCase().startsWith('$OR')) {
            return supplier.annotation.supplierFrequence
        }

        return (supplier.data.name && supplier.data.name.toUpperCase().includes(txt)) ||
            (supplier.data.city && supplier.data.city.toUpperCase().includes(txt)) ||
            (supplier.data.country && supplier.data.country.toUpperCase().includes(txt)) ||
            (supplier.data.oldId && supplier.data.oldId.toString().toUpperCase().includes(txt)) ||
            (supplier.data.sapId && supplier.data.sapId.toString().toUpperCase().includes(txt))
    }



    ngOnInit(): void {
        this.stateInit();

        this.supplierService.getSupplierIdsSetObservableWithBasketForCurrentUser().takeWhile(() => this.isPageRunning).subscribe(idsSet => {
            this.supplierIdsSetWithBasketForCurrentUser = idsSet
            this.setBasketInformation()
        })
    }

    setSuppliers(suppliers) {
        this.suppliers = suppliers
        this.setBasketInformation()
    }


    ngOnDestroy(): void {
        this.isPageRunning = false
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

