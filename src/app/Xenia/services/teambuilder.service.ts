import { Injectable, Inject } from '@angular/core'
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import {utilsObservables as utils2} from 'gg-basic-code'

@Injectable()
export class TeambuilderService {
    constructor( @Inject(DataStore) private dataStore: DataStore) { }

    personTable = 'users.giga'
    functionTable = 'users.giga.functions'
    functionNewTable = 'users.giga.functions.new'
    thematicUnitTable = 'users.giga.thematic.units'
    labosTable = 'users.giga.labos'
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
        const LABODIRid= '5a6a0b2290e2ed2c74e5b34b'

        return Observable.combineLatest(this.dataStore.getDataObservable(this.personTable), this.dataStore.getDataObservable(this.functionTable), this.dataStore.getDataObservable(this.functionNewTable),
            this.getThematicUnits(), this.getLabos(), this.getTeams(),
            (persons, functions, functionsNew, thematicUnits, labos, teams) => {

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

                var fnGetLabo = (personId, team) => {
                    var labo = labos.filter(l => !l.disabled).filter(l => l.directorId === personId)[0]
                    if (labo) return labo
                    if (!team) return undefined
                    return labos.filter(l => !l.disabled).filter(l => l._id === team.laboId)[0]
                }

                var fnGetUnit = (personId, labo, team) => {
                    var u = thematicUnits.filter(t => !t.disabled).filter(u => u.directorId === personId)[0]
                    if (u) return u
                    if (!labo && !team) return undefined   
                    if (labo) return thematicUnits.filter(t => !t.disabled).filter(t => t._id === labo.thematicUnitId)[0]                    
                    return thematicUnits.filter(t => !t.disabled).filter(t => t._id === team.laboId)[0]
                }
                
                var fnUpdateFunctionsIfMember= (idFunctionToSet: string, idsOfPersonsWithThisFunction: string[], personToCheck: any) => {
                    var removeFromArray = (array: any[], id) => {
                        if (!array || array.length === 0) return
                        var index = array.indexOf(id)
                        if (index > -1) {
                            array.splice(index, 1)
                        }
                    }    

                    if (idsOfPersonsWithThisFunction.includes(personToCheck._id) && !((personToCheck.functionNewIds || []).includes(idFunctionToSet))) {
                        personToCheck.functionNewIds = personToCheck.functionNewIds || []
                        personToCheck.functionNewIds.push(idFunctionToSet)
                    }
                    else if (!idsOfPersonsWithThisFunction.includes(personToCheck._id) && ((personToCheck.functionNewIds || []).includes(idFunctionToSet))) {
                        removeFromArray(personToCheck.functionNewIds, idFunctionToSet)
                    }
                }

                var laboHeadIds: string[]= labos.filter(tu => !tu.disabled).map(tu => tu.directorId)
                var unitHeadIds: string[] = thematicUnits.filter(tu => !tu.disabled).map(tu => tu.directorId)    // persons.filter(p => p.unitHeadIds).map(p => p.unitHeadIds).reduce((acc, ids) => acc.concat(ids), []) || []  // collect all TRUD
                var piIds: string[] = teams.filter(t => !t.disabled).map(t => t.piId)   // persons.filter(p => p.piIds).map(p => p.piIds).reduce((acc, ids) => acc.concat(ids), []) || []  // collect all TRUD

                return persons.map(p => {
                    fnUpdateFunctionsIfMember(TRUDid, unitHeadIds, p)
                    fnUpdateFunctionsIfMember(LABODIRid, laboHeadIds, p)
                    fnUpdateFunctionsIfMember(PIid, piIds, p)

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
                    var labo = fnGetLabo(p._id, team)
                    var unit = fnGetUnit(p._id, labo, team)
                    return {
                        data: p,
                        annotation: {
                            functionsTxt: functionsNewTxt || functionsTxt,
                            fullName: p.name + ' ' + p.firstName,
                            isMainPi: team && team.piId === p._id,
                            isPi: (p.functionNewIds || []).includes(PIid) || (p.functionNewIds || []).includes(coPIid),
                            isDirector: unit && unit.directorId === p._id,
                            isLaboDirector: labo && labo.directorId === p._id,
                            piTypeTxt: piTypeTxt,
                            canDelete: fnCanDelete(p._id),
                            team: team,
                            labo: labo,
                            unit: unit,
                            teamHead: team ? fnGetNameOf(team.piId) : undefined,
                            laboHead: labo ? fnGetNameOf(labo.directorId) : undefined,
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

    // Thematic Units
    // ===============

    public getThematicUnits(): Observable<any[]> {
        return this.dataStore.getDataObservable(this.thematicUnitTable)    //.map(list => list.filter(tu => !tu.isDisabled))
    }

    public getThematicUnitsEnabled(): Observable<any[]> {
        return this.getThematicUnits().map(list => list.filter(tu => !tu.disabled))
    }

    public getThematicUnitEnabledByDirector(directorId): Observable<any> {
        return this.getThematicUnitsEnabled().map(units => units.filter(unit => unit.directorId === directorId)[0])
    }



    public getUnitsAnnotated(): Observable<any[]> {
        return Observable.combineLatest(this.getThematicUnits(), this.getLabosAnnotated(), this.getTeams(), (units, labos, teams) => {
            return units.map(unit => {
                var ourLabos = labos.filter(l => l.data.thematicUnitId === unit._id)
                var ourTeams = teams.filter(l => l.laboId === unit._id)
                var personsSet: Set<string> = new Set<string>()
                var fnAddPerson = id => { if (id && !personsSet.has(id)) personsSet.add(id) }
                ourLabos.forEach(l => {
                    fnAddPerson(l.data.directorId);
                    (l.annotation.personIds || []).forEach(m => fnAddPerson(m))
                })
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

    // Labos
    // =====

    public getLabos(): Observable<any[]> {
        return this.dataStore.getDataObservable(this.labosTable)   
    }

    public getLabosEnabled(): Observable<any[]> {
        return this.getLabos().map(list => list.filter(tu => !tu.disabled))
    }

    public getLaboEnabledByDirector(directorId): Observable<any> {
        return this.getLabosEnabled().map(labos => labos.filter(labo => labo.directorId === directorId)[0])
    }

    private getLabosByThematicUnit(unitId): Observable<any[]> {
        return this.getLabos().map(labos => labos.filter(labo => labo.thematicUnitId === unitId))
    }

    public getLabosEnabledByThematicUnit(unitId): Observable<any[]> {
        return this.getLabosEnabled().map(labos => labos.filter(labo => labo.thematicUnitId === unitId))
    }

    public getLabosAnnotatedEnabledByThematicUnit(unitId): Observable<any[]> {
        return this.getLabosAnnotated().map(labos => labos.filter(labo => labo.data.thematicUnitId === unitId))
    }
    

    public getLabosAnnotated(): Observable<any[]> {
        return Observable.combineLatest(this.getLabos(), this.getTeams(), (labos, teams) => {
            return labos.map(labo => {
                var ourTeams = teams.filter(t => t.laboId === labo._id)
                var personsSet: Set<string> = new Set<string>()
                var fnAddPerson = id => { if (id && !personsSet.has(id)) personsSet.add(id) }
                ourTeams.forEach(t => {
                    fnAddPerson(t.piId);
                    (t.memberIds || []).forEach(m => fnAddPerson(m))
                })
                return {
                    data: labo,
                    annotation: {
                        nbPersons: personsSet.size,
                        personIds: Array.from(personsSet.values())
                    }
                }
            })
        })
    }

    

    // Teams
    // ======

    private getTeams(): Observable<any[]> {
        return this.dataStore.getDataObservable(this.teamsTable) //.map(list => list.filter(tu => !tu.isDisabled))
    }

    private getTeamsEnabled(): Observable<any[]> {
        return this.getTeams().map(list => list.filter(tu => !tu.disabled))
    }

    public getTeamEnabledByPi(piId): Observable<any> {
        return this.getTeamsEnabled().map(teams => teams.filter(team => team.piId === piId)[0])
    }
    
    private getTeamsByLabo(laboId): Observable<any[]> {
        return this.getTeams().map(teams => teams.filter(team => team.laboId === laboId))
    }

    public getTeamsEnabledByLabo(laboId): Observable<any[]> {
        return this.getTeamsEnabled().map(teams => teams.filter(team => team.laboId === laboId))
    }





    public saveLaboDirsOfUnit(unit: any, ids: string[]) {
        if (!unit) return
        this.getLabosByThematicUnit(unit._id).first().subscribe(labos => {
            var observables: Observable<any>[] = []

            // new pis
            var idsToAdd = ids.filter(id => !labos.map(u => u.directorId).includes(id))
            observables.concat(idsToAdd.map(id => this.dataStore.addData(this.labosTable, { directorId: id, thematicUnitId: unit._id })))

            // existing pis, but disabled
            observables.concat(labos.filter(labo => labo.disabled && ids.includes(labo.directorId)).map(labo => {
                labo.disabled = false
                return this.dataStore.updateData(this.labosTable, labo._id, labo)
            }))

            // pis in db, but not included anymore
            observables.concat(labos.filter(labo => !labo.disabled && !ids.includes(labo.directorId)).map(labo => {
                labo.disabled = true
                return this.dataStore.updateData(this.labosTable, labo._id, labo)
            }))

            Observable.forkJoin(observables).subscribe()
        })
    }
    



    public savePisOfLaboOrUnit(labo: any, ids: string[]) {
        if (!labo) return
        this.getTeamsByLabo(labo._id).first().subscribe(teams => {
            var observables: Observable<any>[] = []

            // new pis
            var idsToAdd = ids.filter(id => !teams.map(team => team.piId).includes(id))
            observables.concat(idsToAdd.map(id => this.dataStore.addData(this.teamsTable, { piId: id, laboId: labo._id })))

            // existing pis, but disabled
            observables.concat(teams.filter(team => team.disabled && ids.includes(team.piId)).map(team => {
                team.disabled = false
                return this.dataStore.updateData(this.teamsTable, team._id, team)
            }))

            // pis in db, but not included anymore
            observables.concat(teams.filter(team => !team.disabled && !ids.includes(team.piId)).map(team => {
                team.disabled = true
                return this.dataStore.updateData(this.teamsTable, team._id, team)
            }))

            Observable.forkJoin(observables).subscribe()
        })
    }

}
