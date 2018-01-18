import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { ProductService } from './../Shared/Services/product.service'
import { ConfigService } from './../Shared/Services/config.service'
import { Observable } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';

@Component(
    {
        selector: 'gg-user-list',
        templateUrl: './user-list.component.html'
    }
)
export class UserListComponent implements OnInit {

    constructor() {
    }


    users: any
    openPanelId: string = "";
    @Input() usersObservable: Observable<any>;
    @Input() state;
    @Input() path: string = 'users'
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    fnFilter(user, txt) {
        if (txt.trim() === '') return true;
        return (user.data.name || '').toUpperCase().includes(txt.toUpperCase()) || (user.data.firstName || '').toUpperCase().includes(txt.toUpperCase())
    }

    ngOnInit(): void {
        this.stateInit();
    }

    ngOnDestroy(): void {
    }

    getUserObservable(id: string): Observable<any> {
        return this.usersObservable.map(users => users.filter(s => {
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


    public getBooleanText(flg) {
        if (flg === true) return 'GENERAL.YES'
        //if (flg === false) return 'GENERAL.NO'
        return 'GENERAL.EMPTY'
    }
}

