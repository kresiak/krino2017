import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { PlatformService } from './../Shared/Services/platform.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {utilsComparators as comparatorsUtils} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-platform-machines',
        templateUrl: './platform-machines.component.html'
    }
)
export class PlatformMachinesComponent implements OnInit {
    constructor (private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

public machineForm: FormGroup
public machinesList: any
public isPageRunning: boolean = true

    ngOnInit(): void {
        this.machineForm = this.formBuilder.group({
            nameOfMachine: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            price: ['', Validators.required],
            lifetime: ['', Validators.required],
            maintenancePrice: ['', Validators.required],
            occupancy: [''],
            hoursPerDay: [''],
            hoursPerYear: ['']
        })

        this.platformService.getAnnotatedMachines().takeWhile(() => this.isPageRunning).subscribe(machines => {
            if (!comparatorsUtils.softCopy(this.machinesList, machines))
                this.machinesList= comparatorsUtils.clone(machines)            
        })
        
    }

    save(formValue, isValid) {
        this.dataStore.addData('platform.machines', {
            name: formValue.nameOfMachine,
            description: formValue.description,
            price: formValue.price,
            lifetime: formValue.lifetime,
            maintenancePrice: formValue.maintenancePrice,
            occupancy: formValue.occupancy,
            hoursPerDay: formValue.hoursPerDay,
            hoursPerYear: formValue.hoursPerYear
        }).subscribe(res =>
        {
            this.reset()
        })
    }

    reset()
    {
        this.machineForm.reset()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    nameMachineUpdated(name, machineItem) {
        machineItem.data.name = name
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }

    descriptionMachineUpdated(description, machineItem) {
        machineItem.data.description = description
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }

    priceMachineUpdated(price, machineItem) {
        machineItem.data.price = +price
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }

    lifetimeMachineUpdated(lifetime, machineItem) {
        machineItem.data.lifetime = +lifetime
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }

    maintenancePriceMachineUpdated(maintenancePrice, machineItem) {
        machineItem.data.maintenancePrice = +maintenancePrice
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }

    occupancyMachineUpdated(occupancy, machineItem) {
        machineItem.data.occupancy = +occupancy
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }

    hoursPerDayMachineUpdated(hoursPerDay, machineItem) {
        machineItem.data.hoursPerDay = +hoursPerDay
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }
    
    hoursPerYearMachineUpdated(hoursPerYear, machineItem) {
        machineItem.data.hoursPerYear = +hoursPerYear
        this.dataStore.updateData('platform.machines', machineItem.data._id, machineItem.data)
    }
   
}