import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import { SelectableData } from 'gg-basic-code'
import { TeambuilderService } from '../services/teambuilder.service'
import { FormItemStructure, FormItemType} from 'gg-ui'

@Component(
    {
        selector: 'gg-giga-person-enter',
        templateUrl: './giga-person-enter.component.html'
    }
)
export class GigaPersonEnterComponent implements OnInit {
    selectableFunctions: Observable<SelectableData[]>;

    public personTable = 'users.giga'
    public functionTable = 'users.giga.functions.new'

    @Output() personHasBeenAdded: EventEmitter<any> = new EventEmitter()

    isPageRunning: boolean = true;

    constructor(private dataStore: DataStore, private teambuilderService: TeambuilderService) {
    }

    public formStructure: FormItemStructure[]= []

    ngOnInit(): void {
        this.selectableFunctions = this.dataStore.getDataObservable(this.functionTable).takeWhile(() => this.isPageRunning).map(functions => {
            return functions.sort((a, b) => a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1).map(f => new SelectableData(f._id, f.name, ['5a3022de02557d00d84aef81', '5a30218002557d00d84aef7e', '5a6a0b2290e2ed2c74e5b34b'].includes(f._id)))
        })
        
        this.formStructure.push(new FormItemStructure('name', 'PUBLIC.TEAMBUILDER.PERSONS.LABEL.NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('firstName', 'PUBLIC.TEAMBUILDER.PERSONS.LABEL.FIRST NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        this.formStructure.push(new FormItemStructure('email', 'PUBLIC.TEAMBUILDER.PERSONS.LABEL.EMAIL', FormItemType.InputText, {isRequired: true, isEmail:true}))
        this.formStructure.push(new FormItemStructure('telephone', 'PUBLIC.TEAMBUILDER.PERSONS.LABEL.TELEPHONE', FormItemType.InputText, {isTelephone:true}))
        this.formStructure.push(new FormItemStructure('ulgId', 'PUBLIC.TEAMBUILDER.PERSONS.LABEL.U USER', FormItemType.InputText, {value:''}))
        this.formStructure.push(new FormItemStructure('selectedFunctionIds', 'PUBLIC.TEAMBUILDER.PERSONS.LABEL.FUNCTIONS', FormItemType.GigaSelector, {selectableData: this.selectableFunctions}))
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public formSaved(data) {
        var person: any= {}
        if (data.name) person.name = data.name
        if (data.firstName) person.firstName = data.firstName
        if (data.email) person.email = data.email
        if (data.telephone) person.telephone = data.telephone
        if (data.ulgId) person.ulgId = data.ulgId
        if (data.selectedFunctionIds) person.functionNewIds = data.selectedFunctionIds
        person.fullName= ((person.name || '') + (person.name ? ' ' : '') + (person.firstName || '')).trim()
        this.dataStore.addData(this.personTable, person).first().subscribe(res => {
            this.personHasBeenAdded.next(res._id)
            data.setSuccess('OK')
        });
    }

}