import { Observable } from 'rxjs/Rx';
import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'

@Injectable()
export class AdminService {

    constructor( @Inject(DataStore) private dataStore: DataStore) {

    }

    getLabo(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('labos'),
            (labos) => {
                if (!labos || labos.length === 0) {
                    return {
                        data: {
                            name: '',
                            adminIds: [],
                            secrExecIds: [],
                            validationSteps: [],
                            passwordGroupOrdersUser: 'go',
                            warningNbMonthsToEnd: 2,
                            warningNbRepeats: 1,
                            warningNbDaysBetweenRepeats: 5
                        },
                        annotation: {
                            validationSteps: this.getPossibleSteps()
                        }
                    }
                }
                else {
                    var x= {
                        data: labos[0],
                        annotation: {
                            validationSteps: this.getSteps(labos[0].validationSteps || [])
                        }
                    }

                    if (!x.data.warningNbMonthsToEnd) x.data.warningNbMonthsToEnd=2
                    if (!x.data.warningNbRepeats) x.data.warningNbRepeats=1
                    if (!x.data.warningNbDaysBetweenRepeats) x.data.warningNbDaysBetweenRepeats=5


                    if (! x.data.sapFirstIdList) {
                        x.data.sapFirstIdList= [
                            {
                                nbOfCharacters: 7,
                                startingWith: 1,
                                firstId: 1760511
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },
                            {
                                nbOfCharacters: 8,
                                startingWith: 1,
                                firstId: 554555
                            },                            
                        ]
                    }

                    return x
                }
            });
    }

    getValidationStepDescription(validationStepName: string): string {
         if (validationStepName === "SecrExec") return 'Executive Secretary'
         if (validationStepName === "EquipeHead") return 'Head of equipe'
         if (validationStepName === "Equipe") return 'Validator'
    }

    canUserValidateStep(annotatedUser, annotatedLabo, validationStepName: string, orderingEquipeId: string) : boolean {
        if (validationStepName === "SecrExec") return annotatedUser.annotation.isSecrExec;
        if (validationStepName === "Equipe") {
            var step= annotatedLabo.data.validationSteps.filter(step => step.name==='Equipe')[0]
            if (!step || !step.equipeId) return false
            return annotatedUser.annotation.equipes.map(eq => eq._id).includes(step.equipeId);
        }
        if (validationStepName === "EquipeHead") {
            return annotatedUser.annotation.equipesLeading && orderingEquipeId && annotatedUser.annotation.equipesLeading.includes(orderingEquipeId)
        }
        return false
    }


    private getPossibleSteps():any[] {
        return [
            {
                name: "EquipeHead",
                enabled: false
            },
            {
                name: "Equipe",
                enabled: false,
                equipeId: undefined
            },
            {
                name: "SecrExec",
                enabled: false
            }
        ]    
    }

    private getSteps(stepsFromDb: any[]): any[] {
        var steps: any[]= stepsFromDb.map(s => s)
        steps.forEach(step => {
            step.enabled= true
        })
        this.getPossibleSteps().filter(possibleStep=> !steps.map(step => step.name).includes(possibleStep.name)).forEach(stepToAdd => {
            steps.push(stepToAdd)
        })
        return steps
    }

}