import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { Observable } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';


@Component(
    {
        selector: 'gg-supplier-sap-list',
        templateUrl: './supplier-sap-list.component.html'
    }
)
export class SupplierSapListComponent implements OnInit {
    constructor(private dataStore: DataStore) {
    }

    public suppliers; //: Observable<any>;
    public suppliersObservable: Observable<any>

    @Input() state;
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    filterSuppliers = function (supplier, txt) {   // check that there is no use of this. here... 
        if (txt === '' || txt === '$') return true

        return (supplier.name && supplier.name.toUpperCase().includes(txt)) ||
            (supplier.city && supplier.city.toUpperCase().includes(txt)) ||
            (supplier.country && supplier.country.toUpperCase().includes(txt)) ||
            (supplier.sapId && supplier.sapId.toString().toUpperCase().includes(txt))
    }

    ngOnInit(): void {
        this.stateInit();
        this.suppliersObservable= this.dataStore.getDataObservable('sap.supplier')
    }

    ngOnDestroy(): void {
    }


    getSupplierObservable(id: string): Observable<any> {
        return this.dataStore.getDataObservable('sap.supplier').map(suppliers => {
            let supplier = suppliers.filter(s => s._id === id)[0];
            return supplier ? supplier : null;
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

