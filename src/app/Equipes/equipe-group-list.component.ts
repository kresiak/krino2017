import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core'
import { EquipeService } from '../Shared/Services/equipe.service';
import { Observable } from 'rxjs/Rx'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { DOCUMENT } from '@angular/platform-browser'



@Component(
    {
        //moduleId: module.id,
        selector: 'gg-equipe-group-list',
        templateUrl: './equipe-group-list.component.html'
    }
)
export class EquipeGroupListComponent implements OnInit {
    constructor(private equipeService: EquipeService) {
    }

    equipesObservable: Observable<any>;
    equipes: any

    @Input() state;
    @Input() initialTabInEquipeDetail: string = '';
    @Input() path: string= 'equipegroups'
    @Output() stateChanged = new EventEmitter();


    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    fnFilter(equipe, txt) {
        if (txt.trim() === '') return true;
        return (equipe.data.name || '').toUpperCase().includes(txt.toUpperCase()) || (equipe.data.description || '').toUpperCase().includes(txt.toUpperCase())
    }

    ngOnInit(): void {
        this.stateInit();
        this.equipesObservable = this.equipeService.getAnnotatedEquipesGroups();
    }

    ngOnDestroy(): void {
    }


    getEquipeObservable(id: string): Observable<any> {
        return this.equipesObservable.map(equipes => equipes.filter(s => s.data._id === id)[0]);
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

