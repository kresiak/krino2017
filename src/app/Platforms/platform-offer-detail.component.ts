import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { PlatformService } from './../Shared/Services/platform.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'

@Component(
    {
        selector: 'gg-platform-offer-detail',
        templateUrl: './platform-offer-detail.component.html'
    }
)
export class PlatformOfferDetailComponent implements OnInit {
    operativeStatusesObservable: Observable<{ id: number; name: string; }[]>;
    commercialStatusesObservable: Observable<any>;

    snapshotList: any[];
    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private platformService: PlatformService) {
    }

    @Input() offerItem
    @Input() isSnapshot: boolean = false

    public isPageRunning: boolean = true
    public clientsListObservable
    public clientId: string
    public servicesObservable: Observable<any>

    public snapshotForm: FormGroup
    public state

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    ngOnInit(): void {
        this.stateInit()

        this.clientsListObservable = this.platformService.getAnnotatedClients().takeWhile(() => this.isPageRunning).map(clients => clients.map(client => {
            return {
                id: client.data._id,
                name: client.annotation.fullName + ' (' + client.annotation.enterprise + ')'
            }
        }))

        this.commercialStatusesObservable = Observable.from([this.platformService.getCommercialStatuses()])
        this.operativeStatusesObservable = Observable.from([this.platformService.getOperativeStatuses()])

        this.servicesObservable = this.platformService.getAnnotatedServices().map(services => services.filter(s => s.annotation.currentSnapshot))

        this.snapshotForm = this.formBuilder.group({
            description: ['', [Validators.required, Validators.minLength(3)]]
        })

        this.dataStore.getDataObservable('platform.offer.snapshots').map(snapshots => snapshots.filter(s => s.offerId === this.offerItem.data._id).sort((a, b) => b.data.version - a.data.version))
            .takeWhile(() => this.isPageRunning).subscribe(snapshots => {
                this.snapshotList = snapshots
            })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    descriptionUpdated(description, offerItem) {
        offerItem.data.description = description
        this.dataStore.updateData('platform.offers', offerItem.data._id, offerItem.data)
    }

    commercialStatusUpdated(commercialStatusId, offerItem) {
        offerItem.data.commercialStatusId = commercialStatusId
        this.dataStore.updateData('platform.offers', offerItem.data._id, offerItem.data)
    }

    operativeStatusUpdated(operativeStatusId, offerItem) {
        offerItem.data.operativeStatusId = operativeStatusId
        this.dataStore.updateData('platform.offers', offerItem.data._id, offerItem.data)
    }

    clientIdUpdated(clientId, offerItem) {
        offerItem.data.clientId = clientId
        this.dataStore.updateData('platform.offers', offerItem.data._id, offerItem.data)
    }

    getServicesIdsSelected() {
        return (this.offerItem.data.services || []).map(p => p.id)
    }

    servicesChanged(servicesIds: string[]) {
        if (!this.offerItem.data.services) this.offerItem.data.services = []
        var services = this.offerItem.data.services

        services = services.filter(s => servicesIds.includes(s.id))

        servicesIds.filter(id => !services.map(p => p.id).includes(id)).forEach(id => services.push({ id: id, quantity: 1, reduction: 0 }))

        this.offerItem.data.services = services

        this.dataStore.updateData('platform.offers', this.offerItem.data._id, this.offerItem.data)
    }

    deleteService(pos) {
        this.offerItem.data.services.splice(pos, 1)
        this.dataStore.updateData('platform.offers', this.offerItem.data._id, this.offerItem.data)
    }

    serviceQuantityUpdated(pos, quantity) {
        this.offerItem.data.services[pos].quantity = quantity
        this.dataStore.updateData('platform.offers', this.offerItem.data._id, this.offerItem.data)
    }

    servicePrepaidUpdated(pos, isPrepaid) {
        this.offerItem.data.services[pos].isPrepaid = isPrepaid
        this.dataStore.updateData('platform.offers', this.offerItem.data._id, this.offerItem.data)
    }

    serviceReductionUpdated(pos, reduction) {
        this.offerItem.data.services[pos].reduction = reduction
        this.dataStore.updateData('platform.offers', this.offerItem.data._id, this.offerItem.data)
    }

    serviceCommentUpdated(pos, comment) {
        this.offerItem.data.services[pos].comment = comment
        this.dataStore.updateData('platform.offers', this.offerItem.data._id, this.offerItem.data)
    }

    snapshotService(formValue, isValid) {
        if (!isValid) return
        this.platformService.snapshotOffer(this.offerItem, formValue.description).subscribe(res => {
            this.resetSnapshotForm()
        })
    }

    public blockSendToClient: boolean = false

    SendToClient() {
        if (!this.blockSendToClient) {
            this.blockSendToClient = true
            this.platformService.snapshotOffer(this.offerItem, 'As sent to client', 2).subscribe(res => {
            })
        }
    }

    public blockInvoiceHasBeenSent: boolean = false

    InvoiceHasBeenSent() {
        if (!this.blockInvoiceHasBeenSent) {
            this.blockInvoiceHasBeenSent= true
            this.platformService.snapshotOffer(this.offerItem, 'As when invoice was sent to client', 8).subscribe(res => {
            })
        }
    }

    resetSnapshotForm() {
        this.snapshotForm.reset()
    }

    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
        }
    };

}