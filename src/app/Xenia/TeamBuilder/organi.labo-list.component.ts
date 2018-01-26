import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import {utilsObservables as utils} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-organi-labo-list',
        templateUrl: './organi.labo-list.component.html'
    }
)
export class OrganiLaboList implements OnInit {
    personsMap: Map<string, any>;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore) {
    }

    fnFilter = (labo, txt) => {
        if (txt.trim() === '') return true;
        return (labo.data.name || '').toUpperCase().includes(txt.toUpperCase())  || (this.personsMap && this.personsMap.has(labo.data.directorId) && this.personsMap.get(labo.data.directorId).annotation.fullName.toUpperCase().includes(txt.toUpperCase()))
    }

    @Input() labosObservable: any

    ngOnInit(): void {
        this.teambuilderService.getPersonsAnnotated().map(persons => utils.hashMapFactoryForAnnotated(persons)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.personsMap= res
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getLaboObservable(id: string): Observable<any> {
        return this.labosObservable.map(labos => labos.filter(s => {
            return s.data._id === id
        })[0]);
    }

    getPersonName(id) {        
        return this.personsMap.has(id) ? this.personsMap.get(id).annotation.fullName : 'unknown'
    }

}

