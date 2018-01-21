import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import { SelectableData } from 'gg-basic-code'
import { TeambuilderService } from '../services/teambuilder.service'

@Component(
    {
        selector: 'gg-giga-person-enter',
        templateUrl: './giga-person-enter.component.html'
    }
)
export class GigaPersonEnterComponent implements OnInit {
    selectableFunctions: Observable<SelectableData[]>;
    public newUserForm: FormGroup;

    public personTable = 'users.giga'
    public functionTable = 'users.giga.functions.new'

    @Output() personHasBeenAdded: EventEmitter<any> = new EventEmitter()

    isPageRunning: boolean = true;

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private teambuilderService: TeambuilderService) {
    }

    ngOnInit(): void {
        const emailRegex = /^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}\s*$/i;
        const telRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im

        this.newUserForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],
            telephone: ['', [Validators.pattern(telRegex)]],
            ulgId: ['']
        });

        this.selectableFunctions = this.dataStore.getDataObservable(this.functionTable).takeWhile(() => this.isPageRunning).map(functions => {
            return functions.sort((a, b) => a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1).map(f => new SelectableData(f._id, f.name))
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }
    @ViewChild('functionsSelector') functionsChild;

    selectedFunctionIds: any[]= [];

    save(formValue, isValid) {
        this.dataStore.addData(this.personTable, {
            name: formValue.name.trim(),
            firstName: formValue.firstName.trim(),
            email: formValue.email.trim(),
            telephone: formValue.telephone.trim(),
            fullName: formValue.name.trim() + ' ' + formValue.firstName.trim(),
            functionIds: this.selectedFunctionIds,
            ulgId: formValue.ulgId
        }).first().subscribe(res => {
            this.personHasBeenAdded.next(res._id)
            this.reset();
        });
    }

    reset() {
        this.newUserForm.reset();
        this.functionsChild.emptyContent()            
    }

    public functionSelectionChanged(ids) {
        this.selectedFunctionIds = ids;
    }

    public functionHasBeenAdded(fonction: string) {
        this.dataStore.getDataObservable(this.functionTable).first().subscribe(functions => {
            if (functions.filter(f => f.name.toUpperCase().trim() === fonction.toUpperCase().trim()).length === 0) {
                this.dataStore.addData(this.functionTable, {name: fonction.trim()})
            }
        })        
    }

}