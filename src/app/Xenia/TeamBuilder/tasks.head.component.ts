import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from './../../Shared/Services/data.service'


@Component(
    {
        selector: 'gg-tasks-head',
        templateUrl: './tasks.head.component.html'
    }
)
export class TasksHeadComponent implements OnInit {
    thisPerson: any;
    personsObservable: Observable<any>;
    isPageRunning: boolean = true;

    constructor(private route: ActivatedRoute, private teambuilderService: TeambuilderService, private dataStore: DataStore) {

    }

    public thisPersonId: string

    ngOnInit(): void {
        this.personsObservable= this.route.params
            .do((params: Params) => {
                this.thisPersonId = params['id']
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.thisPersonId)
            })
            .do(thisPerson => {
                this.thisPerson = thisPerson
            })
            .switchMap(() => {
                return this.teambuilderService.getThematicUnitsEnabled().map(list => list.map(tu => tu.directorId))
            })
            .switchMap(unitHeadIds => {
                return this.teambuilderService.getPersonsAnnotatedByIds(unitHeadIds)
            })

        this.personsObservable.takeWhile(() => this.isPageRunning).subscribe()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    personsSelectionChanged(ids: string[]) {
        this.teambuilderService.getThematicUnits().first().subscribe(units => {
            var observables: Observable<any>[]= []

            // new directors
            var idsToAdd= ids.filter(id => !units.map(u => u.directorId).includes(id))
            observables.concat(idsToAdd.map(id => this.dataStore.addData(this.teambuilderService.thematicUnitTable, {directorId: id})))

            // existing directors, but disabled
            observables.concat(units.filter(u => u.disabled && ids.includes(u.directorId)).map(u => {
                u.disabled= false
                return this.dataStore.updateData(this.teambuilderService.thematicUnitTable, u._id, u)
            }))

            // directors in db, but not included anymore
            observables.concat(units.filter(u => !u.disabled && !ids.includes(u.directorId)).map(u => {
                u.disabled= true
                return this.dataStore.updateData(this.teambuilderService.thematicUnitTable, u._id, u)
            }))
            
            Observable.forkJoin(observables).subscribe()
        })
    }
}

