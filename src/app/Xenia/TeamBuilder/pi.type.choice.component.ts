import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from './../../Shared/Classes/selectable-data'
import { AuthService } from '../services/authorization.service'

@Component(
    {
        selector: 'gg-pi-type-choice',
        templateUrl: './pi.type.choice.component.html'
    }
)
export class PiTypeChoiceComponent implements OnInit {
    authorizationStatusInfo: any;    
    piListObservable: Observable<any>;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
        this.piTypes= this.teambuilderService.piTypes
    }

    @Input() thisPerson: any
    @Input() askForDependentPi: boolean= true
    @Input() noSecurity: boolean= false

    public piTypes 

    ngOnInit(): void {
        this.piListObservable = this.teambuilderService.getPersonsPisAnnotatedWithExceptions([this.thisPerson.data._id]).takeWhile(() => this.isPageRunning).map(persons => persons.map(p => {
            return {
                id: p.data._id,
                name: p.annotation.fullName
            }
        }))

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })        
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public personTable = 'users.giga'

    piTypeChanged(typeId: string) {
        this.thisPerson.data.piType = typeId
        this.dataStore.updateData(this.personTable, this.thisPerson.data._id, this.thisPerson.data)
    }

    piDependingOnUpdated(id) {
        this.thisPerson.data.piDependingOnId = id
        this.dataStore.updateData(this.personTable, this.thisPerson.data._id, this.thisPerson.data)
    }

    hasRights() {
        return this.noSecurity || this.authorizationStatusInfo.isMyself(this.thisPerson) || this.authorizationStatusInfo.isBossOf(this.thisPerson)
    }

}

