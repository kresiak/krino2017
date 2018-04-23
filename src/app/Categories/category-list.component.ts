import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable, Subject } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { utilsReports as reportsUtils } from 'gg-basic-code'

@Component(
    {
        selector: 'gg-category-list',
        templateUrl: './category-list.component.html'
    }
)
export class CategoryListComponent implements OnInit {
    constructor() {
    }

    @Input() categoryObservable: Observable<any>;
    categories: any
    openPanelId: string = "";

    @Input() state;
    @Input() path: string = 'categories'
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    filterCategories(category, txt) { 
        if (txt === '' || txt === '#') return !category.data.isBlocked

        if (txt.startsWith('#NC')) {
            return ! category.annotation.nbClassifications
        }

        if (txt.startsWith('#BL')) {
            return category.data.isBlocked
        }

        return (category.data.name && (category.data.name.toUpperCase().includes(txt))) || (category.annotation.classificationsTxt || '').toUpperCase().includes(txt) || (category.data.noArticle || '').toUpperCase().includes(txt) 
            || (category.data.groupMarch || '').toUpperCase().includes(txt)
    }

    createReport(categories) {

        var fnFormat = cat => {
            return {
                'Name': cat.data.name,
                'Classifications': cat.annotation.classificationsTxt,
                'Blocked': cat.data.isBlocked ? 'Blocked' : 'Active',
                'No article': cat.data.noArticle || '',
                'Group march.': cat.data.groupMarch || ''
            }
        }

        var listNonDeleted = categories.filter(cat => !cat.data.isBlocked).map(fnFormat)
        var listDeleted = categories.filter(cat => cat.data.isBlocked).map(fnFormat)

        reportsUtils.generateReport(listNonDeleted.concat(listDeleted))
    }


    ngOnInit(): void {
        this.stateInit();
    }

    ngOnDestroy(): void {
    }


    getCategoryObservable(id: string): Observable<any> {
        return this.categoryObservable.map(categories => categories.filter(s => {
            return s.data._id === id
        }

        )[0]);
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

