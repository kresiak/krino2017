import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from './../../Shared/Classes/selectable-data'

@Component(
    {
        selector: 'gg-tasks-pi',
        templateUrl: './tasks.pi.component.html'
    }
)
export class TasksPiComponent implements OnInit {
    selectablePisObservable: Observable<any>;
    nbPersons: number = 0;
    nbFunctionsToSpecify: number = 0;
    selectablePersonsObservable: Observable<any>
    thisPerson: any;
    personsObservable: Observable<any>;
    isPageRunning: boolean = true;

    //private newEquipeForm: FormGroup

    constructor(private route: ActivatedRoute, private teambuilderService: TeambuilderService, private dataStore: DataStore, private formBuilder: FormBuilder) {

    }

    public thisPersonId: string
    public thisTeam: any

    ngOnInit(): void {
        this.personsObservable = this.route.params
            .do((params: Params) => {
                this.thisPersonId = params['id']
                this.selectablePisObservable = this.teambuilderService.getPersonsPisAnnotatedWithExceptions([this.thisPersonId])
                    .map(persons => persons.map(p => new SelectableData(p.data._id, p.annotation.fullName)))
            })
            .switchMap(() => {
                return this.teambuilderService.getPersonAnnotated(this.thisPersonId)
            })
            .do(thisPerson => {
                this.thisPerson = thisPerson
            })
            .switchMap(thisPerson => {
                return this.teambuilderService.getTeamEnabledByPi(this.thisPerson.data._id)
            })
            .do(thisTeam => {
                this.thisTeam = thisTeam
            })
            .switchMap(thisTeam => {
                var memberIds = thisTeam ? thisTeam.memberIds : []                
                return this.teambuilderService.getPersonsAnnotatedByIds(memberIds)
            })

        this.personsObservable.takeWhile(() => this.isPageRunning).subscribe((persons: any[]) => {
            this.nbFunctionsToSpecify = persons.filter(p => !p.data.functionNewIds || p.data.functionNewIds.length === 0).length
            this.nbPersons = persons.length
        })


/*         this.newEquipeForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]]
        });
 */

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    personsSelectionChanged(ids) {
        if (!this.thisTeam) return
        this.thisTeam.memberIds = ids
        this.dataStore.updateData(this.teambuilderService.teamsTable, this.thisTeam._id, this.thisTeam)
    }
    
    projectNameChanged(name) {
        this.thisTeam.name = name
        this.dataStore.updateData(this.teambuilderService.teamsTable, this.thisTeam._id, this.thisTeam)
    }

/*     save(formValue, isValid) {
        var name = formValue.name.trim()
        if (!this.thisPerson.data.equipes) this.thisPerson.data.equipes = []
        if (this.thisPerson.data.equipes.map(e => e.name.trim().toUpperCase()).includes(name.toUpperCase())) return
        this.thisPerson.data.equipes.push({ name: name })
        this.dataStore.updateData(this.personTable, this.thisPerson.data._id, this.thisPerson.data).subscribe(res => {
            this.reset()
        });
    }

    reset() {
        this.newEquipeForm.reset();
    }

    updateEquipeName(pos, newName) {
        if (!this.thisPerson.data.equipes || pos >= this.thisPerson.data.equipes.length) return
        this.thisPerson.data.equipes[pos].name = newName
        this.dataStore.updateData(this.personTable, this.thisPerson.data._id, this.thisPerson.data)
    }

    updateEquipeMembers(pos, ids) {
        if (!this.thisPerson.data.equipes || pos >= this.thisPerson.data.equipes.length) return
        this.thisPerson.data.equipes[pos].userIds = ids
        this.dataStore.updateData(this.personTable, this.thisPerson.data._id, this.thisPerson.data)
    }

    deleteEquipe(pos) {
        if (!this.thisPerson.data.equipes || pos >= this.thisPerson.data.equipes.length) return
        this.thisPerson.data.equipes.splice(pos, 1)
        this.dataStore.updateData(this.personTable, this.thisPerson.data._id, this.thisPerson.data)
    }
 */
/*     getEquipeMemberIdsObservable(pos) {
        return Observable.from([this.thisPerson.data.equipes[pos].userIds || []])
    }
 */

    getAssociatedPisIdsObservable() {
        if (!this.thisTeam) return Observable.from([[]])
        return Observable.from([this.thisTeam.associatedPiIds || []])
    }

    updateAssociatedPis(ids) {
        if (!this.thisTeam) return
        this.thisTeam.associatedPiIds = ids
        this.dataStore.updateData(this.teambuilderService.teamsTable, this.thisTeam._id, this.thisTeam)
    }
}

