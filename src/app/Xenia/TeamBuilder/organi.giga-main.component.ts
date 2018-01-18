import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { AuthService } from '../services/authorization.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from './../../Shared/Classes/selectable-data'
import { SignedInStatusInfo } from '../services/authorization.service';

@Component(
    {
        selector: 'gg-organi-giga-main',
        templateUrl: './organi.giga-main.component.html'
    }
)
export class OrganiGigaMain implements OnInit {
    authorizationStatusInfo: SignedInStatusInfo;
    personsObservable: Observable<any>;
    personsPiObservable: Observable<any>;
    unitsObservable: Observable<any[]>;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
    }

    ngOnInit(): void {
        this.unitsObservable= this.teambuilderService.getUnitsAnnotated()

        this.personsObservable = this.teambuilderService.getPersonsAnnotated()

        this.personsPiObservable= this.teambuilderService.getPersonsPisAnnotatedWithExceptions([])

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    loginHasBeenTried(data) {
        this.authService.tryLogin(data.user, data.password)        
    }
}

