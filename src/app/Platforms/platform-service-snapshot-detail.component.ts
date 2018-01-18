import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from './../Shared/Services/data.service'
import { ProductService } from './../Shared/Services/product.service'
import { PlatformService } from './../Shared/Services/platform.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-platform-service-snapshot-detail',
        templateUrl: './platform-service-snapshot-detail.component.html'
    }
)
export class PlatformServiceSnapshotDetailComponent implements OnInit {
    snapshotSteps: any[];

    constructor(private dataStore: DataStore, private platformService: PlatformService, private formBuilder: FormBuilder, private productService: ProductService) {
    }

    @Input() snapshot

    public isPageRunning: boolean = true

    public state
    //private linkToProductForm: FormGroup

    public clientListObservable

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    ngOnInit(): void {
        this.stateInit()


/*        this.linkToProductForm = this.formBuilder.group({
            nameOfLink: ['', [Validators.required, Validators.minLength(3)]],
            description: ['']
        })
*/
        this.clientListObservable = this.dataStore.getDataObservable('platform.client.types').takeWhile(() => this.isPageRunning).map(clientTypes => clientTypes.map(ct => {
            return {
                id: ct._id,
                name: ct.name
            }
        }));        

        this.dataStore.getDataObservable('platform.service.step.snapshots').map(steps => steps.filter(step => step.serviceId === this.snapshot._id && !step.data.isDisabled)).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.snapshotSteps= res
        })

    }

/*    saveLinkToProductForm(formValue, isValid) {
        this.dataStore.addData('', {
            name: formValue.nameOfLink,
            description: formValue.description
        }).subscribe(res => {
            this.resetLinkToProductForm()
        })
    }

    resetLinkToProductForm() {
        this.linkToProductForm.reset()
    }

*/
    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    enableDisableSnapshot(isDisabled: boolean, snapshot) {
        delete snapshot.confirmation
        snapshot.isDisabled = isDisabled
        this.dataStore.updateData('platform.service.snapshots', snapshot._id, snapshot)
    }

    getTotalForClientTypeId(clientTypeId) {
        return this.snapshotSteps.reduce((acc, step) => {
            var x = (step.annotation.costsByClientType || []).filter(c => c.clientTypeId===clientTypeId)[0]
            return acc + (x ? x.grandTotalCost : 0)
        }, 0 )
    }

    getTotalForStepAndClientTypeId(step, clientTypeId) {
        var x = (step.annotation.costsByClientType || []).filter(c => c.clientTypeId===clientTypeId)[0]
        return x ? x.grandTotalCost : 0
    }

    getInfoForStepAndClientTypeId(step, clientTypeId) {
        var x = (step.annotation.costsByClientType || []).filter(c => c.clientTypeId===clientTypeId)[0]
        return x 
    }
    
    getAnnotatedProductsById(id: string): Observable<any> {
        return this.productService.getAnnotatedProductsById(id)
    }

}