import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { PlatformService } from './../Shared/Services/platform.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import * as moment from "moment"
import {utilsDates as utilsdate} from 'gg-basic-code'


@Component(
    {
        selector: 'gg-platform-service-snapshots',
        templateUrl: './platform-service-snapshots.component.html'
    }
)
export class PlatformServiceSnapshotsComponent implements OnInit {
    observableSnapshots: Observable<any[]>;
    observableDisabledSnapshots: Observable<any[]>;

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

    @Input() serviceId: string

    public isPageRunning: boolean = true

    public state
    public snapshotForm: FormGroup

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    ngOnInit(): void {
        this.stateInit()

        this.observableSnapshots= this.dataStore.getDataObservable('platform.service.snapshots').map(snapshots => snapshots.filter(s => s.serviceId===this.serviceId && !s.isDisabled).sort(utilsdate.getSortFn(x => x.createDate)))

        this.observableDisabledSnapshots= this.dataStore.getDataObservable('platform.service.snapshots').map(snapshots => snapshots.filter(s => s.serviceId===this.serviceId && s.isDisabled))
        


        this.snapshotForm = this.formBuilder.group({
            version: [utilsdate.nowFormated(), [Validators.required, Validators.minLength(3)]],
            description: ['']
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    snapshotService(formValue, isValid) {
        if (!isValid) return
        this.platformService.snapshotService(this.serviceId, formValue.version, formValue.description).subscribe(res => {
            this.resetSnapshotForm()
        })
    }

    resetSnapshotForm() {
        this.snapshotForm.reset()
    }
}