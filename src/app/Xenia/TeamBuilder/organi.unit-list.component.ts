import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from './../../Shared/Classes/selectable-data'
import * as utils from '../../Shared/Utils/observables'

@Component(
    {
        selector: 'gg-organi-unit-list',
        templateUrl: './organi.unit-list.component.html'
    }
)
export class OrganiUnitList implements OnInit {
    personsMap: Map<string, any>;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore) {
    }

    fnFilter = (unit, txt) => {
        if (txt.trim() === '') return true;
        return (unit.data.name || '').toUpperCase().includes(txt.toUpperCase())  || (this.personsMap && this.personsMap.has(unit.data.directorId) && this.personsMap.get(unit.data.directorId).annotation.fullName.toUpperCase().includes(txt.toUpperCase()))
    }

    @Input() unitsObservable: any

    ngOnInit(): void {
        this.teambuilderService.getPersonsAnnotated().map(persons => utils.hashMapFactoryForAnnotated(persons)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.personsMap= res
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getUnitObservable(id: string): Observable<any> {
        return this.unitsObservable.map(units => units.filter(s => {
            return s.data._id === id
        })[0]);
    }

    getPersonName(id) {        
        return this.personsMap.has(id) ? this.personsMap.get(id).annotation.fullName : 'unknown'
    }

}

