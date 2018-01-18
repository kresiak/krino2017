import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'

@Component(
    {
        selector: 'gg-giga-person-task',
        templateUrl: './giga-person-task.component.html'
    }
)
export class GigaPersonTaskComponent implements OnInit {
    person: any
    personneIds: any;
    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService) {
    }

    @Input() personsObservable: Observable<any>;
    @Input() myPersonId: string
    @Input() personTypeDescriptionKey: string
    @Input() optionTabTitleKey: string= ""
    @Input() optionTabTipKey: string= ""
    
    @Output() personsSelectionChanged: EventEmitter<any> = new EventEmitter()

    ngOnInit(): void {

        this.personsObservable.map(personnes => personnes.map(p => p.data._id)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.personneIds = res
        })

        this.teambuilderService.getPersonsAnnotated().map(persons => persons.filter(p => p.data._id === this.myPersonId)[0]).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.person = res
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public selectionChanged(ids) {
        this.personsSelectionChanged.next(ids)
    }

}

