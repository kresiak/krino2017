import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'


@Component(
    {
        selector: 'gg-tasks-labo',
        templateUrl: './tasks.labo.component.html'
    }
)
export class TasksLaboComponent implements OnInit {
    thisPerson: any;
    personsObservable: Observable<any>;
    isPageRunning: boolean = true;

    constructor(private route: ActivatedRoute, private teambuilderService: TeambuilderService, private dataStore: DataStore) {

    }

    public thisPersonId: string
    public pisToSpecify
    public thisLabo: any

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
                return this.teambuilderService.getLaboEnabledByDirector(this.thisPerson.data._id)
            })
            .do(thisLabo => {
                this.thisLabo = thisLabo
            })
            .switchMap(thisLabo => {
                return !thisLabo ? Observable.from([]) : this.teambuilderService.getTeamsEnabledByLabo(thisLabo._id).map(list => list.map(tu => tu.piId))
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
        this.teambuilderService.savePisOfLabo(this.thisLabo, ids)
    }

    laboNameChanged(name) {
        this.thisLabo.name= name
        this.dataStore.updateData(this.teambuilderService.labosTable, this.thisLabo._id, this.thisLabo)
    }
}

