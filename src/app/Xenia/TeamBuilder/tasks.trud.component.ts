import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'


@Component(
    {
        selector: 'gg-tasks-trud',
        templateUrl: './tasks.trud.component.html'
    }
)
export class TasksTrudComponent implements OnInit {
    thisPerson: any;
    personsObservable: Observable<any>;
    isPageRunning: boolean = true;

    constructor(private route: ActivatedRoute, private teambuilderService: TeambuilderService, private dataStore: DataStore) {

    }

    public thisPersonId: string
    public pisToSpecify
    public thisUnit: any

    ngOnInit(): void {
        this.personsObservable = this.route.params
            .do((params: Params) => {
                this.thisPersonId = params['id']
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.thisPersonId)
            })
            .do(thisPerson => {
                this.thisPerson = thisPerson
            })
            .switchMap(thisPerson => {
                return this.teambuilderService.getThematicUnitEnabledByDirector(this.thisPerson.data._id)
            })
            .do(thisUnit => {
                this.thisUnit = thisUnit
            })
            .switchMap(thisUnit => {
                return !thisUnit ? Observable.from([]) : this.teambuilderService.getTeamsEnabledByThematicUnit(thisUnit._id).map(list => list.map(tu => tu.piId))
            })
            .switchMap(piIds => {
                return this.teambuilderService.getPersonsAnnotatedByIds(piIds)
            })

        this.personsObservable.takeWhile(() => this.isPageRunning).subscribe(pis => {
            this.pisToSpecify = pis.filter(pi => !pi.data.piType)
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    personsSelectionChanged(ids) {
        this.teambuilderService.savePisOfUnit(this.thisUnit, ids)
    }

    truNameChanged(name) {
        this.thisUnit.name= name
        this.dataStore.updateData(this.teambuilderService.thematicUnitTable, this.thisUnit._id, this.thisUnit)
    }
}

