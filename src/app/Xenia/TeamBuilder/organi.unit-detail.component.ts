import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { AuthService } from '../services/authorization.service'

@Component(
    {
        selector: 'gg-organi-unit-detail',
        templateUrl: './organi.unit-detail.component.html'
    }
)
export class OrganiUnitDetail implements OnInit {
    authorizationStatusInfo: any;

    laboDirectorIds: any[];
    labosObservable: Observable<any[]>;
    teamsObservable: Observable<any[]>;
    
    director: any;
    personsLabDirectorsObservable: Observable<any>;
    personsMembersObservable: Observable<any>;
    directorId: any;
    unit: any;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
    }

    @Input() unitObservable: any

    ngOnInit(): void {
        this.unitObservable
            .do((unit: any) => {
                this.unit = unit
                this.directorId = unit.data.directorId
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.directorId)
            })
            .takeWhile(() => this.isPageRunning).subscribe(thisPerson => {
                this.director = thisPerson
            })        

        

        this.personsLabDirectorsObservable =
            this.unitObservable.switchMap((unit) => {
                this.labosObservable = !unit ? Observable.from([[]]) : this.teambuilderService.getLabosAnnotatedEnabledByThematicUnit(unit.data._id)
                return this.labosObservable
            })
                .switchMap(labos => {
                    var directorIds = (labos || []).map(l => l.data.directorId)
                    return this.teambuilderService.getPersonsAnnotatedByIds(directorIds)
                })

        this.personsLabDirectorsObservable.map(personnes => personnes.map(p => p.data._id)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.laboDirectorIds = res
        })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.personsMembersObservable = this.unitObservable.switchMap((unit) => {
            return this.teambuilderService.getPersonsAnnotatedByIds(unit.annotation.personIds)
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    nameUpdated(name) {
        this.unit.data.name = name
        this.dataStore.updateData(this.teambuilderService.thematicUnitTable, this.unit.data._id, this.unit.data)
    }

    isMyUnit() {
        return this.authorizationStatusInfo.isMyUnit(this.unit.data)
    }
}

