import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { AuthService } from '../services/authorization.service'
import {utilsObservables as utils} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-organi-team-detail',
        templateUrl: './organi.team-detail.component.html'
    }
)
export class OrganiTeamDetail implements OnInit {
    memberIdsInitial: string[];
    authorizationStatusInfo: any;    
    
    personneIds: any[];
    personsObservable: Observable<any>;
    piPerson: any
    selectablePisObservable: Observable<SelectableData[]>;
    piId: string
    team: any

    initialTab: string= 'tabPersons'

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
    }

    @Input() teamObservable: Observable<any>

    ngOnInit(): void {
        this.personsObservable = this.teamObservable.takeWhile(() => this.isPageRunning)
            .do((team) => {
                this.team = team
                this.piId = team.piId
                this.selectablePisObservable = this.teambuilderService.getPersonsPisAnnotatedWithExceptions([this.piId])
                    .map(persons => persons.map(p => new SelectableData(p.data._id, p.annotation.fullName)))
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.piId)
            })
            .do(pi => {
                this.piPerson = pi
            })
            .switchMap(() => {
                var memberIds = this.team ? this.team.memberIds : []
                return this.teambuilderService.getPersonsAnnotatedByIds(memberIds).map(persons => persons.filter(p => !p.data.hasLeft))
            })

        this.personsObservable.map(personnes => personnes.map(p => p.data._id)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.personneIds = res
        })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })     
        
        this.teamObservable.first().subscribe(team => {
            this.memberIdsInitial= team.memberIds
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
        if (!this.isMyTeam()) {
            var addedMemberIds: string[]= (this.team.memberIds || []).filter(m => !this.memberIdsInitial.includes(m))
            var removedMemberIds: string[]= (this.memberIdsInitial || []).filter(m => !((this.team.memberIds || []).includes(m)))
            this.teambuilderService.getPersonsAnnotatedByIds(addedMemberIds.concat(removedMemberIds)).first().subscribe(persons => {
                var map: Map<string, any>= utils.hashMapFactoryForAnnotated(persons)
                var fnGetName= (id) => {
                    if (!map.has(id)) return 'unknown person'
                    return map.get(id).annotation.fullName
                }
                var txt=''
                addedMemberIds.forEach(id => {
                    txt += (txt ? ', ' : '') + 'arrived ' + fnGetName(id)
                })
                removedMemberIds.forEach(id => {
                    txt += (txt ? ', ' : '') + 'quitted ' + fnGetName(id)
                })
                if (txt) {
                    txt+= ' mail to ' + this.piPerson.data.email
                    console.log(txt)
                }
                // TODO: write e-mail
            })
        }
    }

    personsSelectionChanged(ids) {
        if (!this.team) return
        this.team.memberIds = ids
        this.dataStore.updateData(this.teambuilderService.teamsTable, this.team._id, this.team)
    }

    nameUpdated(name) {
        this.team.name= name
        this.dataStore.updateData(this.teambuilderService.teamsTable, this.team._id, this.team)
    }

    isMyTeam() {
        return this.authorizationStatusInfo.isMyTeam(this.team)
    }
    
}

