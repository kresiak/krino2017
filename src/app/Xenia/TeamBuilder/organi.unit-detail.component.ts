import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from './../../Shared/Services/data.service'
import { SelectableData } from './../../Shared/Classes/selectable-data'
import { AuthService } from '../services/authorization.service'

@Component(
    {
        selector: 'gg-organi-unit-detail',
        templateUrl: './organi.unit-detail.component.html'
    }
)
export class OrganiUnitDetail implements OnInit {
    authorizationStatusInfo: any;    
    
    personneIds: any[];
    teamsObservable: Observable<any[]>;
    director: any;
    personsPisObservable: Observable<any>;
    personsMembersObservable: Observable<any>;
    directorId: any;
    unit: any;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
    }

    @Input() unitObservable: any

    ngOnInit(): void {
        this.personsPisObservable = this.unitObservable
            .do((unit: any) => {
                this.unit = unit
                this.directorId= unit.data.directorId
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.directorId)
            })
            .do(thisPerson => {
                this.director = thisPerson
            })
            .switchMap(() => {
                this.teamsObservable= !this.unit ? Observable.from([[]]) : this.teambuilderService.getTeamsEnabledByThematicUnit(this.unit.data._id)
                return this.teamsObservable
            })
            .switchMap(teams => {
                var piIds= (teams || []).map(t => t.piId)
                return this.teambuilderService.getPersonsAnnotatedByIds(piIds)
            })

            this.personsPisObservable.map(personnes => personnes.map(p => p.data._id)).takeWhile(() => this.isPageRunning).subscribe(res => {
                this.personneIds = res
            })                

            this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
                this.authorizationStatusInfo= statusInfo
            })        
          
            this.personsMembersObservable= this.unitObservable.switchMap((unit) => { 
                return this.teambuilderService.getPersonsAnnotatedByIds(unit.annotation.personIds)
            })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    personsSelectionChanged(ids)  {
        this.teambuilderService.savePisOfUnit(this.unit.data, ids)
    }

    nameUpdated(name) {
        this.unit.data.name= name
        this.dataStore.updateData(this.teambuilderService.thematicUnitTable, this.unit.data._id, this.unit.data)
    }

    isMyUnit() {
        return this.authorizationStatusInfo.isMyUnit(this.unit.data)
    }
}

