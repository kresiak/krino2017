import { Injectable, Inject } from '@angular/core'
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import * as utils2 from '../../Shared/Utils/observables'

@Injectable()
export class TeambuilderService {
    constructor( @Inject(DataStore) private dataStore: DataStore) { }

    personTable = 'users.giga'
    functionTable = 'users.giga.functions'
    functionNewTable = 'users.giga.functions.new'
    thematicUnitTable = 'users.giga.thematic.units'
    teamsTable = 'users.giga.teams'

    public piTypes = [
        { value: 'CPI', display: 'Core Pi' },
        { value: 'IPI', display: 'Independent Associate Pi' },
        { value: 'API', display: 'Dependent Associate Pi' }
    ];

    public getPersonsAnnotated() {
        const TRUDid = '5a3022de02557d00d84aef81'  //thematic research unit id in DB
        const PIid = '5a30218002557d00d84aef7e'  //PI id in DB
        const coPIid = '5a3d7072590b2663d0b3323b'

        return Observable.combineLatest(this.dataStore.getDataObservable(this.personTable), this.dataStore.getDataObservable(this.functionTable), this.dataStore.getDataObservable(this.functionNewTable),
            this.getThematicUnits(), this.getTeams(),
            (persons, functions, functionsNew, thematicUnits, teams) => {

                var personMap: Map<string, any> = utils2.hashMapFactory(persons)

                var fnGetNameOf = ((id) => {
                    if (!personMap.has(id)) return 'unknown person'
                    var person = personMap.get(id)
                    return person.firstName + ' ' + person.name
                })

                var fnCanDelete = (() => {
                    var allReferencedPersons: Set<string> = new Set<string>()

                    var addToRefPers = id => { if (!allReferencedPersons.has(id)) allReferencedPersons.add(id) }
                    thematicUnits.forEach(tu => addToRefPers(tu.directorId))
                    teams.forEach(t => addToRefPers(t.piId))
                    teams.forEach(t => (t.memberIds || []).forEach(m => addToRefPers(m)))

                    return (personId) => !allReferencedPersons.has(personId)
                })()

                var fnGetTeam = (personId) => {
                    return teams.filter(t => !t.disabled).filter(t => t.piId === personId || (t.memberIds || []).includes(personId))[0]
                }

                var fnGetUnit = (personId, team) => {
                    var u = thematicUnits.filter(t => !t.disabled).filter(u => u.directorId === personId)[0]
                    if (u) return u
                    if (!team) return undefined
                    return thematicUnits.filter(t => !t.disabled).filter(u => u._id === team.thematicUnitId)[0]
                }

                var removeFromArray = (array: any[], id) => {
                    if (!array || array.length === 0) return
                    var index = array.indexOf(id)
                    if (index > -1) {
                        array.splice(index, 1)
                    }
                }

                var unitHeadIds: string[] = thematicUnits.filter(tu => !tu.disabled).map(tu => tu.directorId)    // persons.filter(p => p.unitHeadIds).map(p => p.unitHeadIds).reduce((acc, ids) => acc.concat(ids), []) || []  // collect all TRUD
                var piIds: string[] = teams.filter(t => !t.disabled).map(t => t.piId)   // persons.filter(p => p.piIds).map(p => p.piIds).reduce((acc, ids) => acc.concat(ids), []) || []  // collect all TRUD

                return persons.map(p => {
                    if (unitHeadIds.includes(p._id) && !((p.functionNewIds || []).includes(TRUDid))) {
                        p.functionNewIds = p.functionNewIds || []
                        p.functionNewIds.push(TRUDid)
                    }
                    else if (!unitHeadIds.includes(p._id) && ((p.functionNewIds || []).includes(TRUDid))) {
                        removeFromArray(p.functionNewIds, TRUDid)
                    }
                    if (piIds.includes(p._id) && !((p.functionNewIds || []).includes(PIid))) {
                        p.functionNewIds = p.functionNewIds || []
                        p.functionNewIds.push(PIid)
                    }
                    else if (!piIds.includes(p._id) && ((p.functionNewIds || []).includes(PIid))) {
                        removeFromArray(p.functionNewIds, PIid)
                    }
                    var selectedFunctions = functions.filter(f => p.functionIds.includes(f._id)) || []
                    var selectedFunctionsNew = functionsNew.filter(f => (p.functionNewIds || []).includes(f._id)) || []
                    var functionsTxt = selectedFunctions.sort((a, b) => a.name < b.name ? -1 : 1).reduce((acc, f) => acc + (acc ? ', ' : '') + f.name, '')
                    var functionsNewTxt = selectedFunctionsNew.sort((a, b) => a.name < b.name ? -1 : 1).reduce((acc, f) => acc + (acc ? ', ' : '') + f.name, '')

                    var piTypeTxt = (p.piType && this.piTypes.filter(t => t.value === p.piType)[0]) ? this.piTypes.filter(t => t.value === p.piType)[0].display : ''
                    if (p.piType === 'API' && p.piDependingOnId) {
                        var depPi = persons.filter(p2 => p2._id === p.piDependingOnId)[0]
                        if (depPi) {
                            piTypeTxt += ' (' + depPi.name + ' ' + depPi.firstName + ')'
                        }
                    }

                    var team = fnGetTeam(p._id)
                    var unit = fnGetUnit(p._id, team)
                    return {
                        data: p,
                        annotation: {
                            functionsTxt: functionsNewTxt || functionsTxt,
                            fullName: p.name + ' ' + p.firstName,
                            isPi: (p.functionNewIds || []).includes(PIid) || (p.functionNewIds || []).includes(coPIid),
                            isDirector: unit && unit.directorId === p._id,
                            piTypeTxt: piTypeTxt,
                            canDelete: fnCanDelete(p._id),
                            team: team,
                            unit: unit,
                            teamHead: team ? fnGetNameOf(team.piId) : undefined,
                            unitHead: unit ? fnGetNameOf(unit.directorId) : undefined
                        }
                    }
                })
            })
    }

    public getPersonAnnotated(personId) {
        return this.getPersonsAnnotated().map(persons => persons.filter(p => p.data._id === personId)[0])
    }

    public getPersonsAnnotatedByIds(idList: string[]) {
        return this.getPersonsAnnotated().map(persons => persons.filter(p => (idList || []).includes(p.data._id)))
    }

    public getPersonsPisAnnotatedWithExceptions(exceptionIds: string[]) {
        return this.getPersonsAnnotated().map(persons => persons.filter(p => p.annotation.isPi && !exceptionIds.includes(p.data._id)))
    }

    public getThematicUnits(): Observable<any[]> {
        return this.dataStore.getDataObservable(this.thematicUnitTable)    //.map(list => list.filter(tu => !tu.isDisabled))
    }

    public getThematicUnitsEnabled(): Observable<any[]> {
        return this.getThematicUnits().map(list => list.filter(tu => !tu.disabled))
    }

    public getThematicUnitEnabledByDirector(directorId): Observable<any> {
        return this.getThematicUnitsEnabled().map(units => units.filter(unit => unit.directorId === directorId)[0])
    }

    public getTeams(): Observable<any[]> {
        return this.dataStore.getDataObservable(this.teamsTable) //.map(list => list.filter(tu => !tu.isDisabled))
    }

    public getTeamsEnabled(): Observable<any[]> {
        return this.getTeams().map(list => list.filter(tu => !tu.disabled))
    }

    public getTeamsByThematicUnit(unitId): Observable<any[]> {
        return this.getTeams().map(teams => teams.filter(team => team.thematicUnitId === unitId))
    }

    public getTeamsEnabledByThematicUnit(unitId): Observable<any[]> {
        return this.getTeamsEnabled().map(teams => teams.filter(team => team.thematicUnitId === unitId))
    }

    public getTeamEnabledByPi(piId): Observable<any> {
        return this.getTeamsEnabled().map(teams => teams.filter(team => team.piId === piId)[0])
    }


    public getUnitsAnnotated(): Observable<any[]> {
        return Observable.combineLatest(this.getThematicUnits(), this.getTeams(), (units, teams) => {
            return units.map(unit => {
                var ourTeams = teams.filter(t => t.thematicUnitId === unit._id)
                var personsSet: Set<string> = new Set<string>()
                var fnAddPerson = id => { if (id && !personsSet.has(id)) personsSet.add(id) }
                ourTeams.forEach(t => {
                    fnAddPerson(t.piId);
                    (t.memberIds || []).forEach(m => fnAddPerson(m))
                })
                return {
                    data: unit,
                    annotation: {
                        nbPersons: personsSet.size,
                        personIds: Array.from(personsSet.values())
                    }
                }
            })
        })
    }

    public savePisOfUnit(unit: any, ids: string[]) {
        if (!unit) return
        this.getTeamsByThematicUnit(unit._id).first().subscribe(teams => {
            var observables: Observable<any>[] = []

            // new pis
            var idsToAdd = ids.filter(id => !teams.map(u => u.piId).includes(id))
            observables.concat(idsToAdd.map(id => this.dataStore.addData(this.teamsTable, { piId: id, thematicUnitId: unit._id })))

            // existing pis, but disabled
            observables.concat(teams.filter(u => u.disabled && ids.includes(u.piId)).map(u => {
                u.disabled = false
                return this.dataStore.updateData(this.teamsTable, u._id, u)
            }))

            // pis in db, but not included anymore
            observables.concat(teams.filter(u => !u.disabled && !ids.includes(u.piId)).map(u => {
                u.disabled = true
                return this.dataStore.updateData(this.teamsTable, u._id, u)
            }))

            Observable.forkJoin(observables).subscribe()
        })

    }
}
