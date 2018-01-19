import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { PlatformService } from './../Shared/Services/platform.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {utilsComparators as comparatorsUtils} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-platform-service-step-list',
        templateUrl: './platform-service-step-list.component.html'
    }
)
export class PlatformServiceStepListComponent implements OnInit {
    serviceDisabledStepsList: any;
    
    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

    @Input() serviceId: string = ''
    @Input() clientType: string = ''
    @Input() isSnapshot: boolean = false

    public serviceStepForm: FormGroup
    public serviceStepsList: any
    public isPageRunning: boolean = true

    public machineListObservable

    public state

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    ngOnInit(): void {
        this.stateInit()
        this.serviceStepForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            runtime: ['']            
        })

        if (!this.isSnapshot) {
            this.platformService.getAnnotatedServiceStepsByService(this.serviceId).takeWhile(() => this.isPageRunning).subscribe(serviceSteps => {
                if (!comparatorsUtils.softCopy(this.serviceStepsList, serviceSteps))
                    this.serviceStepsList = comparatorsUtils.clone(serviceSteps)
            })

            this.platformService.getAnnotatedDisabledServiceStepsByService(this.serviceId).takeWhile(() => this.isPageRunning).subscribe(serviceSteps => {
                if (!comparatorsUtils.softCopy(this.serviceDisabledStepsList, serviceSteps))
                    this.serviceDisabledStepsList = comparatorsUtils.clone(serviceSteps)
            })


            this.machineListObservable = this.dataStore.getDataObservable('platform.machines').takeWhile(() => this.isPageRunning).map(machines => machines.map(machine => {
                return {
                    id: machine._id,
                    name: machine.name
                }
            }));
        }
        else {
            this.dataStore.getDataObservable('platform.service.step.snapshots').map(snapshots => snapshots.filter(s => s.serviceId === this.serviceId))
                            .takeWhile(() => this.isPageRunning).subscribe(serviceSteps => {
                                this.serviceStepsList= serviceSteps
                            })
        }


    }

    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
        }
    };

    public machineId: string

    machineChanged(machineId) {
        this.machineId = machineId
    }

    save(formValue, isValid) {
        this.dataStore.addData('platform.service.steps', {
            name: formValue.name,
            description: formValue.description,
            serviceId: this.serviceId,
            machineId: this.machineId,
            runtime: formValue.runtime || 0           
        }).subscribe(res => {
            this.reset()
        })
    }

    reset() {
        this.serviceStepForm.reset()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

}