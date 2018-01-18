import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';




@Component(
    {
        //moduleId: module.id,
        selector: 'gg-stock-list',
        templateUrl: './stock-list.component.html'
    }
)
export class StockListComponent implements OnInit {
    constructor() {
    }

    public products; //: Observable<any>;
    @Input() productsObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() accentOnOrdering: boolean = true
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    filterProducts = function (product, txt) {
        return product.values[0].annotation.product && (product.values[0].annotation.product.toUpperCase().includes(txt.toUpperCase()) 
                                                || product.values[0].annotation.supplier.toUpperCase().includes(txt.toUpperCase())
                                                || product.values[0].annotation.catalogNr.toUpperCase().includes(txt.toUpperCase())
                                            )
    }

    ngOnInit(): void {
        this.stateInit();
    }

    ngOnDestroy(): void {
    }

    getProductObservable(id: string): Observable<any> {
        return this.productsObservable.map(products => {
            let product = products.filter(s => s.key === id)[0];
            return product;
        });
    }

    nbAvailable(product) {
        return product ? product.values.reduce((acc, b) => acc + b.annotation.nbAvailable, 0) : 0;
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

    hasManualChanges(id: string) : boolean {
        let product = this.products.filter(s => s.key === id)[0]
        return (product ? product.values : []).filter(sp => (sp.data.manualChanges || []).length > 0).length > 0
    }
    
}

