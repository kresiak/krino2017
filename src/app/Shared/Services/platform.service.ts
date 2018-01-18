import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'
import { AuthService } from './auth.service'
import { AdminService } from './admin.service'
import { SelectableData } from './../Classes/selectable-data'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import * as utils from './../Utils/observables'
import * as utilsComparator from './../Utils/comparators'
import * as utilsKrino from './../Utils/krino'
import * as utilsDate from './../Utils/dates'


Injectable()
export class PlatformService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService, @Inject(AdminService) private adminService: AdminService) { }

    // Service snapshots....
    // =====================

    private getCurrentSnapshotIdOfService(serviceId, snapshots) {
        var theSnapshot = snapshots.filter(s => !s.isDisabled && s.serviceId === serviceId).sort(utilsDate.getSortFn(x => x.createDate))[0]
        return theSnapshot ? { id: theSnapshot._id, version: theSnapshot.version } : undefined
    }

    private getCostsOfSnapshotMap(snapshotId, snapshotSteps): Map<string, number> {
        var map = new Map()
        snapshotSteps.filter(ss => ss.serviceId === snapshotId && !ss.data.isDisabled).forEach(step => {
            (step.annotation.costsByClientType || []).forEach(costObj => {
                if (!map.has(costObj.clientTypeId)) map.set(costObj.clientTypeId, 0)
                map.set(costObj.clientTypeId, map.get(costObj.clientTypeId) + costObj.grandTotalCost)
            })
        })

        return map
    }

    // Service step annotation....
    // ============================

    private createAnnotatedServiceStep(serviceStep, services: any[], machines, productMap: Map<string, any>, labourTypes, clients, corrections, snapshots, snapshotSteps) {
        var self = this

        var stepServicesInfos = (serviceStep.services || []).map(s => {
            let theService = services.filter(service => s.id === service._id)[0]
            var theSnapshot = this.getCurrentSnapshotIdOfService(s.id, snapshots)
            if (!theSnapshot) return undefined
            var costMap = this.getCostsOfSnapshotMap(theSnapshot.id, snapshotSteps)
            return {
                id: theService._id,
                service: theService.name,
                snapshot: theSnapshot.version,
                quantity: s.quantity,
                costMap: costMap
            }
        }).filter(x => x)

        function getTotals(clientTypeId) {
            let correctionsFactors = self.getCorrectionsOfClientType(clientTypeId, clients, corrections)

            let servicesCosts = stepServicesInfos.map(s => {
                var costUnit = s.costMap.has(clientTypeId) ? +s.costMap.get(clientTypeId) : 0
                return {
                    labeltxt: s.service + ' ' + s.snapshot + ' (' + s.quantity + ' u.)',
                    extraValue: costUnit * s.quantity
                }
            })

            let sumServicesCosts = servicesCosts.reduce((acc, pe) => acc + +pe.extraValue, 0) || 0

            let productsExtras = correctionsFactors.filter(cf => cf.data.isOnProduct).map(cf => {
                return {
                    labeltxt: cf.name + ' (' + cf.perCent + '%)',
                    extraValue: cf.perCent / 100 * (productsCost + consommablesCost)
                }
            })
            let sumProductsExtras = productsExtras.reduce((acc, pe) => acc + +pe.extraValue, 0)

            let labourReductions = correctionsFactors.filter(cf => cf.data.isOnLabour).map(cf => {
                return {
                    labeltxt: cf.name + ' (' + cf.perCent + '%)',
                    extraValue: -(100 - cf.perCent) / 100 * labourCost
                }
            })
            let sumLabourReduction = labourReductions.reduce((acc, pe) => acc + +pe.extraValue, 0)

            // totals
            // ======

            let total = sumServicesCosts + labourCost + sumLabourReduction + productsCost + consommablesCost + sumProductsExtras + ((machine && machine.annotation) ? machine.annotation.costOfHour * (serviceStep.runtime || 0) : 0)

            let totalExtras = correctionsFactors.filter(cf => cf.data.isOnTotal).map(cf => {
                return {
                    labeltxt: cf.name + ' (' + cf.perCent + '%)',
                    extraValue: cf.perCent / 100 * total
                }
            })

            let sumOfTotalExtras = totalExtras.reduce((acc, pe) => acc + +pe.extraValue, 0)

            return {
                clientTypeId: clientTypeId,
                clientType: (clients.filter(c => c._id === clientTypeId)[0] || { name: 'standard' }).name,
                productsExtras: productsExtras,
                labourReductions: labourReductions,
                totalCost: total,
                totalExtras: totalExtras,
                grandTotalCost: total + sumOfTotalExtras,
                servicesCosts: servicesCosts
            }
        }

        if (!serviceStep) return null;

        let service = services.filter(service => serviceStep.serviceId === service._id)[0]

        let machine = machines.filter(machine => serviceStep.machineId === machine.data._id)[0] || {}

        // products 
        // ========

        let productsCost = (serviceStep.products || []).reduce((acc, p) => {
            let nbUnitsInProduct = productMap.has(p.id) ? (utilsKrino.getNumberInString(productMap.get(p.id).package) || 1) : 1
            let unitPrice = productMap.has(p.id) ? productMap.get(p.id).price / nbUnitsInProduct : 0
            return acc + unitPrice * p.quantity
        }, 0)

        let consommablesCost = serviceStep.costConsommables || 0

        // labour
        // ======

        let labourCost = (serviceStep.labourTypes || []).reduce((acc, ltInDb) => {
            let labourType = labourTypes.filter(lt => lt._id === ltInDb.id)[0]
            let unitPrice = labourType ? labourType.hourlyRate : 0
            return acc + unitPrice * ltInDb.nbHours
        }, 0)


        var costsByClientType = clients.map(ct => getTotals(ct._id))
        costsByClientType.push(getTotals(undefined))

        return {
            data: serviceStep,
            annotation:
            {
                serviceName: (service || {}).name,
                serviceDescription: (service || {}).description,
                machineName: (machine.data || {}).name,
                machineCost: (machine && machine.annotation) ? machine.annotation.costOfHour * (serviceStep.runtime || 0) : 0,
                productsCost: productsCost,
                consommablesCost: consommablesCost,
                labourCost: labourCost,
                costsByClientType: costsByClientType,
                grandTotalCost: getTotals((service || {}).clientTypeId).grandTotalCost,
                grandTotalCostOnStandard: getTotals(undefined).grandTotalCost,
                products: (serviceStep.products || []).map(prod => {
                    let nbUnitsInProduct = productMap.has(prod.id) ? (utilsKrino.getNumberInString(productMap.get(prod.id).package) || 1) : 1
                    let unitPrice = productMap.has(prod.id) ? productMap.get(prod.id).price / nbUnitsInProduct : -1
                    return {
                        data: prod,
                        annotation: {
                            product: productMap.has(prod.id) ? productMap.get(prod.id).name : 'unknown product',
                            package: productMap.has(prod.id) ? productMap.get(prod.id).package : 'unknown package',
                            nbUnitsInProduct: nbUnitsInProduct,
                            productPrice: unitPrice,
                            productTotal: prod.quantity * unitPrice
                        }
                    }
                }),
                labourTypes: labourTypes.sort((a, b) => a.name <= b.name ? -1 : 1).map(lt => {
                    var labourTypeAsInDb = (serviceStep.labourTypes || []).filter(slt => slt.id === lt._id)[0]
                    var nbHours = labourTypeAsInDb ? labourTypeAsInDb.nbHours : 0
                    return {
                        data: lt,
                        annotation: {
                            nbHours: nbHours,
                            totalCost: nbHours * lt.hourlyRate
                        }
                    }
                }),
                services: (serviceStep.services || []).map(s => {
                    let theService = services.filter(service => s.id === service._id)[0]
                    let snapshotInfo = stepServicesInfos.filter(si => si.id === s.id)[0]
                    let currentClientTypeId= (service || {}).clientTypeId
                    return {
                        data: s,
                        annotation: {
                            service: theService ? theService.name : 'unknown service',
                            currentSnapshot: snapshotInfo ? snapshotInfo.snapshot : '',
                            costPerUnit: (snapshotInfo && snapshotInfo.costMap && snapshotInfo.costMap.has(currentClientTypeId)) ? snapshotInfo.costMap.get(currentClientTypeId) : undefined
                        }
                    }
                })
            }
        };
    }


    private getAnnotatedServiceSteps(stepObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(
            stepObservable,
            this.dataStore.getDataObservable('platform.services'),
            this.getAnnotatedMachines(),
            this.dataStore.getDataObservable('products').map(utils.hashMapFactory),
            this.dataStore.getDataObservable('platform.labour.types'),
            this.dataStore.getDataObservable('platform.client.types'),
            this.dataStore.getDataObservable('platform.correction.types'),
            this.dataStore.getDataObservable('platform.service.snapshots'),
            this.dataStore.getDataObservable('platform.service.step.snapshots'),
            (serviceSteps, services, machines, productMap, labourTypes, clients, corrections, snapshots, snapshotSteps) => {
                return serviceSteps.map(serviceStep => this.createAnnotatedServiceStep(serviceStep, services, machines, productMap, labourTypes, clients, corrections, snapshots, snapshotSteps))
            });
    }


    getAnnotatedServiceStepsByService(serviceId: string): Observable<any> {
        return this.getAnnotatedServiceSteps(this.dataStore.getDataObservable('platform.service.steps').map(steps => steps.filter(step => step.serviceId === serviceId && !step.isDisabled)))
    }

    getAnnotatedDisabledServiceStepsByService(serviceId: string): Observable<any> {
        return this.getAnnotatedServiceSteps(this.dataStore.getDataObservable('platform.service.steps').map(steps => steps.filter(step => step.serviceId === serviceId && step.isDisabled)))
    }


    // Services annotation....
    // =======================

    getAnnotatedServiceStep(serviceStepId: string): Observable<any> {
        return this.getAnnotatedServiceSteps(this.dataStore.getDataObservable('platform.service.steps').map(steps => steps.filter(step => step._id === serviceStepId))).map(steps => steps[0])
    }

    private getAnnotatedServicesHelper(servicesObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(
            servicesObservable,
            this.dataStore.getDataObservable('platform.client.types'),
            this.dataStore.getDataObservable('platform.correction.types'),
            this.dataStore.getDataObservable('platform.service.categories'),
            this.dataStore.getDataObservable('platform.service.snapshots'),
            this.dataStore.getDataObservable('platform.service.step.snapshots'),
            this.getInternalClientTypeIdObservable(),
            (services, clients, corrections, categories, snapshots, snapshotSteps, internalClientTypeId) => {
                return services.map(service => {
                    let currentSnapshot = this.getCurrentSnapshotIdOfService(service._id, snapshots)
                    var costMap = currentSnapshot ? this.getCostsOfSnapshotMap(currentSnapshot.id, snapshotSteps) : undefined
                    let correctionsFactors = this.getCorrectionsOfClientType(service.clientTypeId, clients, corrections)
                    let clientType = clients.filter(ct => ct._id === service.clientTypeId)[0]
                    let category = categories.filter(ct => (service.categoryIds || []).includes(ct._id)).map(ct => ct.name).sort((a, b) => a > b ? 1 : -1)
                        .reduce((acc, c) => acc ? (acc + ', ' + c) : c, '')
                    return {
                        data: service,
                        annotation: {
                            correctionsFactors: correctionsFactors,
                            clientType: clientType ? clientType.name : 'standard corrections',
                            category: category || 'no category',
                            currentSnapshot: currentSnapshot ? currentSnapshot.version : '',
                            currentSnapshotId: currentSnapshot ? currentSnapshot.id : '',
                            costMapByClientType: costMap ? Array.from(costMap.entries()) : undefined,
                            internalClientCost: (costMap && costMap.has(internalClientTypeId)) ? costMap.get(internalClientTypeId) : 0
                        }
                    }
                })
            });
    }

    getAnnotatedServices(): Observable<any> {
        return this.getAnnotatedServicesHelper(this.dataStore.getDataObservable('platform.services')).map(services => services.sort((a, b) => a.data.name < b.data.name ? -1 : 1))
    }

    getSelectableCategories(): Observable<SelectableData[]> {
        return this.dataStore.getDataObservable('platform.service.categories').map(categories => {
            return categories.sort((cat1, cat2) => { return cat1.name < cat2.name ? -1 : 1; }).map(category =>
                new SelectableData(category._id, category.name)
            )
        });
    }

    createCategory(newCategory): void {
        this.dataStore.addData('platform.service.categories', { 'name': newCategory });
    }




    // Identical or similar services
    // ==============================

    getAnnotatedServicesIdenticalTo(serviceId) {
        return this.getAnnotatedServicesHelper(this.getIdenticalServices(serviceId, this.areServiceIdenticals))
    }

    getAnnotatedServicesSimilarTo(serviceId) {
        return this.getAnnotatedServicesHelper(this.getIdenticalServices(serviceId, this.areServiceSimilars))
    }

    private areServiceIdenticals(service1, service2, stepMap: Map<string, any[]>): boolean {
        if (service1.categoryId !== service2.categoryId) return false

        var irrelevantFields = ['serviceId', 'name', 'description', 'isDisabled']

        var steps1 = (stepMap.get(service1._id) || []).map(s => utilsComparator.stripDbInfo(s, irrelevantFields))
        var steps2 = (stepMap.get(service2._id) || []).map(s => utilsComparator.stripDbInfo(s, irrelevantFields))

        return utilsComparator.compare(steps1, steps2)
    }

    private areServiceSimilars(service1, service2, stepMap: Map<string, any[]>, self): boolean {
        if (self.areServiceIdenticals(service1, service2, stepMap)) return false

        var steps1 = (stepMap.get(service1._id) || [])
        var steps2 = (stepMap.get(service2._id) || [])

        return Math.abs(steps1.length - steps2.length) <= 1
    }


    private getIdenticalServices(serviceId, fnComparator): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('platform.services'),
            this.dataStore.getDataObservable('platform.service.steps').map(steps => steps.filter(s => !s.isDisabled)),
            (services, steps) => {
                var service = services.filter(s => s._id === serviceId)[0]
                if (!service) return []

                var stepMap = steps.reduce((map: Map<string, any[]>, s: any) => {
                    if (!map.has(s.serviceId)) map.set(s.serviceId, [])
                    var arr = map.get(s.serviceId)
                    arr.push(s)
                    map.set(s.serviceId, arr)
                    return map
                }, new Map())

                var x = services.filter(s => s._id !== serviceId).filter(s => fnComparator(s, service, stepMap, this))
                return x
            })
    }

    // Cost calculation
    // =================

    getServicesCostInfo(): Observable<any> {
        return this.getAnnotatedServiceSteps(this.dataStore.getDataObservable('platform.service.steps')).map(steps => {
            return steps.filter(step => !step.data.isDisabled).reduce((map: Map<string, number>, step) => {
                if (!map.has(step.data.serviceId)) map.set(step.data.serviceId, 0)
                map.set(step.data.serviceId, map.get(step.data.serviceId) + step.annotation.grandTotalCost)
                return map
            }, new Map())
        })
    }

    getSnapshotpsCostInfo(): Observable<any> {
        return this.dataStore.getDataObservable('platform.service.step.snapshots').map(steps => {
            return steps.filter(step => !step.data.isDisabled).reduce((map: Map<string, number>, step) => {
                if (!map.has(step.serviceId)) map.set(step.serviceId, 0)
                map.set(step.serviceId, map.get(step.serviceId) + (step.annotation.grandTotalCostOnStandard || step.annotation.grandTotalCost || step.annotation.totalCost || 0))
                return map
            }, new Map())
        })
    }

    getInternalClientTypeIdObservable(): Observable<any> {
        return this.dataStore.getDataObservable('platform.client.types').map(types => {
            var x = types.filter(t => t.isInternalClient)[0]
            return x ? x._id : undefined
        })
    }


    // Copy services...
    // =================

    cloneService(serviceId: string, newName: string, newDescription: string): Observable<any> {
        return this.dataStore.getDataObservable('platform.services').map(services => services.filter(s => s._id === serviceId)[0]).first()
            .switchMap(service => {
                var service2 = utilsComparator.clone(service)
                service2.name = newName
                service2.description = newDescription
                delete service2._id
                return Observable.forkJoin(this.dataStore.addData('platform.services', service2), this.getAnnotatedServiceStepsByService(serviceId).first())
            }).switchMap(res => {
                var newServiceId = res[0]._id
                var steps: any[] = res[1].map(annotatedStep => annotatedStep.data)
                steps.forEach(step => {
                    step.serviceId = newServiceId
                    delete step._id
                })
                return Observable.forkJoin(steps.map(step => this.dataStore.addData('platform.service.steps', step)))
            })
    }

    snapshotOffer(offerItem, description: string, newCommercialStatusId = -1): Observable<any> {
        var offer2 = utilsComparator.clone(offerItem)
        offer2.offerId = offerItem.data._id
        offer2.description = description

        return this.dataStore.addData('platform.offer.snapshots', offer2).switchMap(res => {
            offerItem.data.version= offerItem.data.version + 1
            if (newCommercialStatusId !== -1) offerItem.data.commercialStatusId = newCommercialStatusId
            return this.dataStore.updateData('platform.offers', offerItem.data._id, offerItem.data)
        })
    }

    snapshotService(serviceId: string, version: string, description: string): Observable<any> {
        var newServiceId: string
        var newProductId: string
        var laboConfig
        var serviceToBeSnapshoted
        var self = this

        var getSupplierId = function () {
            return laboConfig.data.platformSellingSupplierId
        }

        var getCategoryId = function () {
            return laboConfig.data.platformSellingCategoryId
        }

        var getCategoryObservable = function (catId) {
            return self.dataStore.getDataObservable('categories').map(categories => categories.filter(c => c._id === catId)[0])
        }

        return this.getAnnotatedServices().map(services => services.filter(s => s.data._id === serviceId)[0]).first()
            .do(service => {
                serviceToBeSnapshoted = service
            })
            .switchMap(service => {
                var service2 = utilsComparator.clone(service)
                service2.version = version
                service2.serviceId = serviceId
                service2.description = description
                return Observable.forkJoin(this.dataStore.addData('platform.service.snapshots', service2),
                    this.getAnnotatedServiceStepsByService(serviceId).first(), this.adminService.getLabo().first())
            })
            .do(res => {
                newServiceId = res[0]._id
                laboConfig = res[2]
            })
            .switchMap(res => {
                var steps: any[] = res[1]
                steps.forEach(step => {
                    step.serviceId = newServiceId
                })
                return Observable.forkJoin(steps.map(step => this.dataStore.addData('platform.service.step.snapshots', step)))
            })
            .switchMap(res => {
                return this.dataStore.getDataObservable('products').map(products => products.filter(p => p.serviceId === serviceId)).first()
            })
            .switchMap(products => {
                if (!products || products.length === 0) return Observable.from([{}])
                return Observable.forkJoin(products.map(p => {
                    p.disabled = true
                    return this.dataStore.updateData('products', p._id, p)
                }))
            })
            .switchMap(res => {
                return getCategoryObservable(getCategoryId())
            })
            .switchMap(category => {
                var prod = {
                    name: serviceToBeSnapshoted.data.name,
                    description: serviceToBeSnapshoted.data.description,
                    catalogNr: version,
                    supplierId: getSupplierId(),
                    price: serviceToBeSnapshoted.annotation.internalClientCost,
                    categoryIds: [category._id],
                    noArticle: category.noArticle,
                    tva: 21,
                    groupMarch: category.groupMarch,
                    serviceId: serviceId,
                    serviceVersionId: newServiceId,
                }
                return this.dataStore.addData('products', prod)
            })
            .do(res => {
                newProductId = res._id
            })
            .switchMap(res => {
                return this.dataStore.getDataObservable('platform.service.snapshots').map(snapshots => snapshots.filter(s => s._id === newServiceId)[0]).first()
            })
            .switchMap(snapshot => {
                snapshot.productId = newProductId
                return this.dataStore.updateData('platform.service.snapshots', snapshot._id, snapshot)
            })

    }

    // Other misc annotation
    // =======================

    getAnnotatedEnterprises() {
        return Observable.combineLatest(this.dataStore.getDataObservable('platform.enterprises'), this.dataStore.getDataObservable('platform.client.types'), (enterprises, clientTypes) => {
            return enterprises.map(enterprise => {
                var type = clientTypes.filter(ct => ct._id === enterprise.clientTypeId)[0]
                return {
                    data: enterprise,
                    annotation: {
                        clientType: type ? type.name : 'unknown type'
                    }
                }
            }).sort((a, b) => a.data.name < b.data.name ? -1 : 1)
        })
    }

    getAnnotatedOffers() {
        return Observable.combineLatest(this.dataStore.getDataObservable('platform.offers'), this.dataStore.getDataObservable('platform.clients'), this.dataStore.getDataObservable('platform.enterprises'),
            this.dataStore.getDataObservable('platform.client.types'), this.getAnnotatedServices(), this.dataStore.getDataObservable('platform.offer.snapshots'),
            (offers, clients, enterprises, clientTypes, annotatedServices, snapshots) => {
                return offers.map(offer => {
                    var client = clients.filter(c => c._id === offer.clientId)[0]
                    var enterprise = client ? enterprises.filter(e => e._id === client.enterpriseId)[0] : undefined
                    var type = enterprise ? clientTypes.filter(ct => ct._id === enterprise.clientTypeId)[0] : undefined
                    var displayClient = client ? ((client.firstName + ' ' + client.name) + (enterprise ? (' / ' + enterprise.name) : '')) : 'unknown client'

                    var status= (this.getCommercialStatuses().filter(cs => cs.id === offer.commercialStatusId)[0] || {name: 'no status yet'}).name

                    var total = (offer.services || []).map(s => {
                        if (!enterprise) return 0
                        let theService = annotatedServices.filter(service => s.id === service.data._id)[0]
                        let unitPrice = (!theService ? 0 : theService.annotation.costMapByClientType.filter(ct => ct[0] === enterprise.clientTypeId)[0])[1] || 0
                        return unitPrice * s.quantity * (1 - +s.reduction / 100)
                    }).reduce((acc, b) => acc + b, 0)
                    return {
                        data: offer,
                        annotation: {
                            hasSnapshots: snapshots.filter(s => s.offerId === offer._id).length > 0,
                            client: displayClient,
                            clientType: type ? type.name : 'unknown',
                            total: total,
                            commercialStatus: status,
                            numero: offer.prefix + offer.offerNo + '/' + offer.version,
                            serviceTxt: (offer.services || []).map(s => (annotatedServices.filter(service => s.id === service.data._id)[0] || { data: {} }).data.name).reduce((a, b) => a + (a ? ', ' : '') + b, ''),
                            services: (offer.services || []).map(s => {
                                let theService = annotatedServices.filter(service => s.id === service.data._id)[0]
                                let unitPrice = (!theService || !enterprise ? 0 : theService.annotation.costMapByClientType.filter(ct => ct[0] === enterprise.clientTypeId)[0])[1] || 0
                                return {
                                    data: s,
                                    annotation: {
                                        service: theService ? theService.data.name : 'unknown service',
                                        version: theService ? theService.annotation.currentSnapshot : 'unknown version',
                                        serviceSnapshotId: theService ? theService.annotation.currentSnapshotId : 'unknown snapshot id',
                                        unitPrice: unitPrice,
                                        total: unitPrice * s.quantity * (1 - +s.reduction / 100)
                                    }
                                }
                            })

                        }
                    }
                })
            })
    }

    getAnnotatedClients() {
        return Observable.combineLatest(this.dataStore.getDataObservable('platform.clients'), this.dataStore.getDataObservable('platform.enterprises'), this.dataStore.getDataObservable('platform.client.types'),
            (clients, enterprises, clientTypes) => {
                return clients.map(client => {
                    var enterprise = enterprises.filter(e => e._id === client.enterpriseId)[0]
                    var type = enterprise ? clientTypes.filter(ct => ct._id === enterprise.clientTypeId)[0] : undefined
                    return {
                        data: client,
                        annotation: {
                            fullNameInverted: client.name + ' ' + client.firstName,                            
                            fullName: client.firstName + ' ' + client.name,
                            enterprise: enterprise ? enterprise.name : 'unknown enterprise',
                            clientType: type ? type.name : 'unknown type'
                        }
                    }
                }).sort((a, b) => a.annotation.fullNameInverted < b.annotation.fullNameInverted ? -1 : 1)
            })
    }



    getAnnotatedMachines() {
        return Observable.combineLatest(this.dataStore.getDataObservable('platform.machines'), (machines) => {
            return machines.map(machine => {
                var annualAmortisation = +machine.price / +machine.lifetime
                var nbHoursPerYear = +machine.hoursPerYear || (+machine.hoursPerDay * 365 * +machine.occupancy / 100)
                var annualCost = annualAmortisation + +machine.maintenancePrice
                return {
                    data: machine,
                    annotation: {
                        isOK: (machine.hoursPerDay && machine.occupancy) || machine.hoursPerYear,
                        annualAmortisation: annualAmortisation,
                        annualCost: annualCost,
                        nbHoursPerYear: nbHoursPerYear,
                        costOfHour: nbHoursPerYear ? (annualCost / nbHoursPerYear) : annualCost
                    }
                }
            })
        })
    }

    getCorrectionsOfClientType(clientTypeId, clients, corrections) {
        var client = clients.filter(c => c._id === clientTypeId)[0]
        return corrections.map(corr => {
            var customCor = (!client || !client.corrections) ? null : client.corrections.filter(cc => cc.id === corr._id)[0]
            return {
                id: corr._id,
                name: corr.name,
                perCent: customCor ? customCor.perCent : corr.defaultPerCent,
                isDefault: !customCor,
                data: corr
            }
        })
    }


// status 
// ======

    getCommercialStatuses() {
        return [
            { id: 1, name: 'Brouillon'},
            { id: 2, name: 'Envoyé au client'},
            { id: 3, name: 'Refusé par client'},
            { id: 4, name: 'Accepté par client'},
            { id: 5, name: 'En attente de bon de commande'},
            { id: 6, name: 'Prêt à réaliser'},
            { id: 7, name: 'Terminé'},
            { id: 8, name: 'Facturé'},
            { id: 9, name: 'Cloturé'}
        ]
    }

    getOperativeStatuses() {
        return [
            { id: 1, name: 'Undefined'},
            { id: 2, name: 'Started'},
            { id: 3, name: 'Finished'}
        ]
    }


}



