import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { AuthService } from '../services/authorization.service'

@Component(
    {
        selector: 'gg-organi-labo-detail',
        templateUrl: './organi.labo-detail.component.html'
    }
)
export class OrganiLaboDetail implements OnInit {
    authorizationStatusInfo: any;    
    
    personneIds: any[];
    teamsObservable: Observable<any[]>;
    director: any;
    personsPisObservable: Observable<any>;
    personsMembersObservable: Observable<any>;
    directorId: any;
    labo: any;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
    }

    @Input() laboObservable: any

    ngOnInit(): void {
        this.personsPisObservable = this.laboObservable
            .do((labo: any) => {
                this.labo = labo
                this.directorId= labo.data.directorId
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.directorId)
            })
            .do(thisPerson => {
                this.director = thisPerson
            })
            .switchMap(() => {
                this.teamsObservable= !this.labo ? Observable.from([[]]) : this.teambuilderService.getTeamsEnabledByLabo(this.labo.data._id)
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
          
            this.personsMembersObservable= this.laboObservable.switchMap((labo) => { 
                return this.teambuilderService.getPersonsAnnotatedByIds(labo.annotation.personIds)
            })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    personsSelectionChanged(ids)  {
        this.teambuilderService.savePisOfLabo(this.labo.data, ids)
    }

    nameUpdated(name) {
        this.labo.data.name= name
        this.dataStore.updateData(this.teambuilderService.labosTable, this.labo.data._id, this.labo.data)
    }

    emailStatusUpdated(flag){
        this.labo.data.mailSent= flag
        this.dataStore.updateData(this.teambuilderService.labosTable, this.labo.data._id, this.labo.data)
    }

    isMyLabo() {
        return this.authorizationStatusInfo.isMyLabo(this.labo.data)
    }
}

