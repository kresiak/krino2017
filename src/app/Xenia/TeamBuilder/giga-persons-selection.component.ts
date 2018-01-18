import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from './../../Shared/Services/data.service'
import * as comparatorsUtils from './../../Shared/Utils/comparators'
import { SelectableData } from './../../Shared/Classes/selectable-data'
import { TeambuilderService } from '../services/teambuilder.service'

@Component(
    {
        selector: 'gg-giga-persons-selection',
        templateUrl: './giga-persons-selection.component.html'
    }
)
export class GigaPersonsSelectionComponent implements OnInit {
    personText: any;
    persons: any[];
    selectedTabId: string = ''

    public newUserForm: FormGroup;

    public personTable = 'users.giga'
    public functionTable = 'users.giga.functions.new'

    @Input() selectedPersonIds: string[] = []
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter()

    public personsObservable: Observable<any>

    isPageRunning: boolean = true;

    constructor(private dataStore: DataStore, private teambuilderService: TeambuilderService) {
    }

    ngOnInit(): void {
        this.personsObservable = this.teambuilderService.getPersonsAnnotated().map(personnes => personnes.filter(p => !p.data.hasLeft)) //this.dataStore.getDataObservable(this.personTable)
        Observable.combineLatest(this.personsObservable.takeWhile(() => this.isPageRunning), this.selectionChanged.startWith(this.selectedPersonIds), (allPersons, ids) => {
            var selectedPersons = allPersons.filter(p => ids.includes(p.data._id)).sort((a, b) => a.annotation.fullName < b.annotation.fullName ? -1 : 1)
            var personText = selectedPersons.map(p => p.annotation.fullName).reduce((acc, p) => {
                return acc + (acc ? '; ' : '') + p
            }, '')
            return {
                personText: personText,
                selectedPersons: selectedPersons
            }
        }).subscribe(res => {
            this.persons = res.selectedPersons
            this.personText = res.personText
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    personHasBeenAdded(newPersonId) {
        this.selectedPersonIds.push(newPersonId)
        this.selectionChanged.next(this.selectedPersonIds)  
    }

    public personsChanged(ids: any[]) {
        this.selectedPersonIds = ids
        this.selectionChanged.next(ids)
    }

    public deletePerson(id) {
        var index = this.selectedPersonIds.indexOf(id)
        if (index > -1) {
            this.selectedPersonIds.splice(index, 1)
            this.selectionChanged.next(this.selectedPersonIds)
        }
    }
}