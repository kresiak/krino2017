import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import {utilsObservables as utils} from 'gg-basic-code'


@Component(
    {
        selector: 'gg-organi-team-list',
        templateUrl: './organi.team-list.component.html'
    }
)
export class OrganiTeamList implements OnInit {
    personsMap: Map<string, any>;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore) {
    }

    fnFilter= (team, txt) => {
        if (txt.trim() === '') return true;
        return (team.name || '').toUpperCase().includes(txt.toUpperCase()) || (this.personsMap && this.personsMap.has(team.piId) && this.personsMap.get(team.piId).annotation.fullName.toUpperCase().includes(txt.toUpperCase()))
    }

    @Input() teamsObservable: any

    ngOnInit(): void {
        this.teambuilderService.getPersonsAnnotated().map(persons => utils.hashMapFactoryForAnnotated(persons)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.personsMap= res
        })        
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getTeamObservable(id: string): Observable<any> {
        return this.teamsObservable.map(teams => teams.filter(s => {
            return s._id === id
        })[0]);
    }

    getPersonName(id) {        
        return this.personsMap.has(id) ? this.personsMap.get(id).annotation.fullName : 'unknown'
    }
    
}

