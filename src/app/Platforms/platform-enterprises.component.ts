import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { PlatformService } from './../Shared/Services/platform.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-platform-enterprises',
        templateUrl: './platform-enterprises.component.html'
    }
)
export class PlatformEnterprisesComponent implements OnInit {
    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

    public enterprisesForm: FormGroup
    public enterprisesList: any
    public isPageRunning: boolean = true
    public clientTypeId: string
    public clientTypeListObservable

    fnFilter(e, txt) {
        if (txt.trim() === '') return true;
        return (e.data.name || '').toUpperCase().includes(txt.toUpperCase()) 
    }

    setEnterprises(enterprisesList) {
        this.enterprisesList= enterprisesList
    }

    ngOnInit(): void {
        this.enterprisesForm = this.formBuilder.group({
            nameOfEnterprise: ['', [Validators.required, Validators.minLength(3)]],
            telephone: ['', Validators.required],
            fax: ['', Validators.required],
            web: ['', Validators.required]
        })

        this.platformService.getAnnotatedEnterprises().takeWhile(() => this.isPageRunning).subscribe(enterprises => {
            if (!comparatorsUtils.softCopy(this.enterprisesList, enterprises))
                this.enterprisesList = comparatorsUtils.clone(enterprises)
        })

        this.clientTypeListObservable = this.dataStore.getDataObservable('platform.client.types').takeWhile(() => this.isPageRunning).map(clientTypes => clientTypes.map(clientType => {
            return {
                id: clientType._id,
                name: clientType.name
            }
        }))

    }

    save(formValue, isValid) {
        this.dataStore.addData('platform.enterprises', {
            name: formValue.nameOfEnterprise,
            telephone: formValue.telephone,
            fax: formValue.fax,
            web: formValue.web,
            clientTypeId: this.clientTypeId
        }).subscribe(res => {
            this.reset()
        })
    }

    reset() {
        this.enterprisesForm.reset()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    clientTypeChanged(clientTypeId) {
        this.clientTypeId = clientTypeId
    }

    nameEnterpriseUpdated(name, enterpriseItem) {
        enterpriseItem.data.name = name
        this.dataStore.updateData('platform.enterprises', enterpriseItem.data._id, enterpriseItem.data)
    }

    telephoneEnterpriseUpdated(telephone, enterpriseItem) {
        enterpriseItem.data.telephone = telephone
        this.dataStore.updateData('platform.enterprises', enterpriseItem.data._id, enterpriseItem.data)
    }

    faxEnterpriseUpdated(fax, enterpriseItem) {
        enterpriseItem.data.fax = fax
        this.dataStore.updateData('platform.enterprises', enterpriseItem.data._id, enterpriseItem.data)
    }

    webEnterpriseUpdated(web, enterpriseItem) {
        enterpriseItem.data.web = web
        this.dataStore.updateData('platform.enterprises', enterpriseItem.data._id, enterpriseItem.data)
    }

    clientTypeUpdated(clientTypeId, enterpriseItem) {
        enterpriseItem.data.clientTypeId = clientTypeId
        this.dataStore.updateData('platform.enterprises', enterpriseItem.data._id, enterpriseItem.data)
    }


}