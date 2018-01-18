import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from './../../../Shared/Services/data.service'
import * as comparatorsUtils from './../../../Shared/Utils/comparators'


@Component(
    {
        selector: 'gg-giga-find-person',
        templateUrl: './giga-find-person.component.html'
    }
)
export class GigaFindPersonComponent implements OnInit {
    persons: any[];
    allPersons: any[];

    @Input() personsObservable: Observable<any> 
    @Input() selectedPersonIds: string[] = []
    @Input() initialSearchText: string = ''
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter()
    @Output() searchTextChanged: EventEmitter<any> = new EventEmitter()

    nbHits: any;
    public nbHitsShown: number = 10
    public nbHitsIncrement: number = 5
    public nbHitsShownObservable: BehaviorSubject<number> = new BehaviorSubject<number>(this.nbHitsShown)

    isPageRunning: boolean = true;
    public searchControl = new FormControl();
    public searchForm;

    constructor(private dataStore: DataStore) {
        this.searchForm = new FormGroup({
            searchControl: new FormControl()
        });
    }

    public createFilterFn(searchString: string) {
        var fnFilterObjects = (person, txt) => {
            if (txt.trim().length < 1) return false
            return (person.data.name || '').toUpperCase().includes(txt.toUpperCase()) || (person.data.firstName || '').toUpperCase().includes(txt.toUpperCase()) || (person.annotation.functionsTxt || '').toUpperCase().includes(txt.toUpperCase())
        }

        var orList = comparatorsUtils.searchTextIntoOrList(searchString.split(/\s+/).join(' AND '))

        return person => comparatorsUtils.testObjectWithOrList(person, orList, fnFilterObjects)
    }

    ngOnInit(): void {
        this.searchControl.setValue(this.initialSearchText)

        Observable.combineLatest(this.personsObservable.takeWhile(() => this.isPageRunning), this.searchControl.valueChanges.debounceTime(400).distinctUntilChanged().startWith(this.initialSearchText),
            (objects, searchTxt: string) => {
                this.searchTextChanged.next(searchTxt)
                var filterFn = this.createFilterFn(searchTxt)
                return objects.filter(filterFn)
            }).do(persons => {
                this.nbHits = persons.length
                this.allPersons = persons
            }).switchMap(persons => {
                return this.nbHitsShownObservable.map(nbItems => {
                    return persons.slice(0, nbItems)
                })
            }).takeWhile(() => this.isPageRunning).subscribe(persons => {
                this.persons = persons
            })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    resetSearchControl() {
        this.searchControl.setValue('')
    }

    public moreHits() {
        this.nbHitsShown += this.nbHitsIncrement
        this.nbHitsShownObservable.next(this.nbHitsShown)
    }

    public isPersonAlreadySelected(id) {
        return this.selectedPersonIds.includes(id)
    }

    public removePerson(id) {
        var index = this.selectedPersonIds.indexOf(id)
        if (index > -1) {
            this.selectedPersonIds.splice(index, 1)
            this.selectionChanged.next(this.selectedPersonIds)
        }
    }

    public addPerson(id) {
        if (!this.selectedPersonIds.includes(id)) {
            this.selectedPersonIds.push(id)
            this.selectionChanged.next(this.selectedPersonIds)
        }
    }
}