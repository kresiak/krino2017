import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { PlatformService } from './../Shared/Services/platform.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-platform-service-compare',
        templateUrl: './platform-service-compare.component.html'
    }
)
export class PlatformServiceCompareComponent implements OnInit {
    service1: any;
    service2: any;
    service1Steps: any;
    service2Steps: any;

    constructor(private dataStore: DataStore, private platformService: PlatformService) {
    }

    @Input() service1Id: string
    @Input() service2Id: string

    private isPageRunning: boolean = true

    ngOnInit(): void {
        this.platformService.getAnnotatedServices().map(services => services.filter(s => s.data._id === this.service1Id)[0]).takeWhile(() => this.isPageRunning).subscribe(service => {
            this.service1 = service
        })
        this.platformService.getAnnotatedServices().map(services => services.filter(s => s.data._id === this.service2Id)[0]).takeWhile(() => this.isPageRunning).subscribe(service => {
            this.service2 = service
        })
        this.platformService.getAnnotatedServiceStepsByService(this.service1Id).takeWhile(() => this.isPageRunning).subscribe(steps => {
            this.service1Steps = steps
        })
        this.platformService.getAnnotatedServiceStepsByService(this.service2Id).takeWhile(() => this.isPageRunning).subscribe(steps => {
            this.service2Steps = steps
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getIndexes(arr) {
        return Array.from(arr.keys())
    }

    mergeBoth(arr1, arr2, fnGetKey) {
        function getElementsByKeys(arr, key): any[] {
            if (!arr) return []
            return arr.filter(elem => fnGetKey(elem) === key)
        }

        function getKeys(arr): any[] {
            if (!arr) return []
            return arr.map(elem => fnGetKey(elem))
        }

        function getDistinctKeys(arr1, arr2) {
            var keys1 = getKeys(arr1)
            var keys2 = getKeys(arr2)

            var set: Set<string> = new Set()

            keys1.forEach(k => {
                if (!set.has(k)) set.add(k)
            })

            keys2.forEach(k => {
                if (!set.has(k)) set.add(k)
            })

            return Array.from(set.values())
        }

        var x=  getDistinctKeys(arr1, arr2).map(key => {
            return {
                key: key,
                arr1: getElementsByKeys(arr1, key),
                arr2: getElementsByKeys(arr2, key) 
            }
        }).reduce((acc, elem) => {
            for (var i: number=0; i<Math.max(elem.arr1.length, elem.arr2.length); i++) {
                acc.push({
                    key: elem.key,
                    val1: i < elem.arr1.length ? elem.arr1[i] : {data: {}, annotation: {}},
                    val2: i < elem.arr2.length ? elem.arr2[i] : {data: {}, annotation: {}}
                })
            }
            return acc
        }, [])

        return x
    }

    mergeBothSteps(arr1, arr2) { 
        return this.mergeBoth(arr1, arr2, step => step.data.machineId)
    }

    mergeBothProducts(arr1, arr2) { 
        return this.mergeBoth(arr1, arr2, prod => prod.data.id)
    }

    mergeBothLabours(arr1, arr2) { 
        return this.mergeBoth(arr1, arr2, labour => labour.data.id)
    }


}