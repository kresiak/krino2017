import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import { SelectableData } from 'gg-basic-code'
import { ConfigService } from 'gg-basic-data-services'


import { TeambuilderService } from '../services/teambuilder.service'
import { AuthService } from '../services/authorization.service'

@Component(
    {
        selector: 'gg-giga-person-detail',
        templateUrl: './giga-person-detail.component.html'
    }
)
export class GigaPersonDetailComponent implements OnInit {
    authorizationStatusInfo: any;
    
    selectedFunctionIdsObservable: any;
    person: any;
    selectableFunctions: Observable<SelectableData[]>;
    public personTable = 'users.giga'
    public functionTable = 'users.giga.functions.new'  

    @Input() personId: string
    @Input() noSecurity: boolean= false

    isPageRunning: boolean = true;

    constructor(private activatedRoute: ActivatedRoute, private dataStore: DataStore, private teambuilderService: TeambuilderService, private configService: ConfigService, private authService: AuthService) {
    }

    public testID= undefined

    ngOnInit(): void {
        this.teambuilderService.getPersonsAnnotated().map(persons => persons.filter(p => p.data._id === this.personId)[0]).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.person = res
            if (this.person)
                this.selectedFunctionIdsObservable = Observable.from([this.person.data.functionNewIds])
        })

        this.selectableFunctions = this.dataStore.getDataObservable(this.functionTable).takeWhile(() => this.isPageRunning).map(functions => {
            return functions.sort((a, b) => a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1).map(f => new SelectableData(f._id, f.name, ['5a3022de02557d00d84aef81', '5a30218002557d00d84aef7e', '5a6a0b2290e2ed2c74e5b34b'].includes(f._id)))
        })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })

        this.activatedRoute.queryParams.subscribe((params: Params) => {
            this.testID = params['ggakmgtest'];
            console.log('testId: ' + this.testID);
          });        
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public getUrl(suffix) {
        var baseUrl= this.configService.isProduction() ? 'http://139.165.57.34/krino/' : 'http://localhost:4200/'

        return baseUrl + suffix + '/' + this.personId + '?ggakmgtest=1'
    }

    public hasRights() {
        return this.noSecurity || (this.authorizationStatusInfo && this.person && this.authorizationStatusInfo.hasRightsOnPerson(this.person))
    }

    public functionHasBeenAdded(fonction: string) {
        this.dataStore.getDataObservable(this.functionTable).first().subscribe(functions => {
            if (functions.filter(f => f.name.toUpperCase().trim() === fonction.toUpperCase().trim()).length === 0) {
                this.dataStore.addData(this.functionTable, { name: fonction.trim() })
            }
        })
    }

    public nameUserUpdated(name) {
        this.person.data.name= name
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)
    }

    public firstNameUserUpdated(firstName) {
        this.person.data.firstName = firstName
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)
    }

    public nationalityUpdated(countryCode) {
        this.person.data.nationality = countryCode
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)        
    }

    public emailUserUpdated(email) {
        this.person.data.email = email
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)
    }

    public telUserUpdated(tel) {
        this.person.data.telephone = tel
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)
    }

    public ulgIdUpdated(id) {
        this.person.data.ulgId = id
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)        
    }

    public functionSelectionChanged(ids) {
        this.person.data.functionNewIds = ids
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)
    }

    public deletePerson() {
        if (!this.person.annotation.canDelete) return
        this.dataStore.deleteData(this.personTable, this.person.data._id)
    }

    public hasLeftUpdated(hasLeft) {
        this.person.data.hasLeft = hasLeft
        this.dataStore.updateData(this.personTable, this.person.data._id, this.person.data)        
    }
}