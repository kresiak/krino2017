import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';

@Component(
    {
        selector: 'gg-giga-person-list',
        templateUrl: './giga-person-list.component.html'
    }
)
export class GigaPersonListComponent implements OnInit {

    constructor() {
    }

    persons: any
    openPanelId: string = "";
    @Input() personsObservable: Observable<any>;
    @Input() noSecurity: boolean= false

    fnFilter(person, txt) {
        if (txt.trim() === '') return true;

        if (txt.startsWith('$CD')) {
            return person.annotation.canDelete
        }

        if (txt.startsWith('$QG')) {
            return person.data.hasLeft
        }
        
        return (person.data.name || '').toUpperCase().includes(txt.toUpperCase()) || (person.data.firstName || '').toUpperCase().includes(txt.toUpperCase()) || (person.data.ulgId || '').toUpperCase().includes(txt.toUpperCase())
            || (person.annotation.functionsTxt || '').toUpperCase().includes(txt.toUpperCase()) || (person.data.email || '').toUpperCase().includes(txt.toUpperCase())
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    // This is typically used for accordions with ngFor, for remembering the open Accordion Panel (see template as well)    
    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.openPanelId = $event.panelId;
        }
    };
}

