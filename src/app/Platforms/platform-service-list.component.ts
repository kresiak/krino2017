import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { PlatformService } from './../Shared/Services/platform.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'

@Component(
    {
        selector: 'gg-platform-service-list',
        templateUrl: './platform-service-list.component.html'
    }
)
export class PlatformServiceListComponent implements OnInit {

    constructor(private platformService: PlatformService) {
    }

    @Input() servicesObservable: Observable<any>
    @Input() serviceToCompareToId: string= undefined
    @Input() isForSelection: boolean = false
    @Input() selectedServiceIds: string[]= []

    @Output() servicesSelected = new EventEmitter();

    public isPageRunning: boolean = true

    public servicesList: any

    public fnGetCostByService = (id) => 0 // this is a function

    public state

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    fnFilter(s, txt: string) {
        if (txt === '' || txt === '$' ) return !s.data.isDisabled
        if (txt === '$D') return s.data.isDisabled
        return !s.data.isDisabled && ((s.data.description || '').toUpperCase().includes(txt) || (s.data.name || '').toUpperCase().includes(txt) || (s.annotation.category || '').toUpperCase().includes(txt))
    }

    setServices(services) {
        this.servicesList= services
        this.state.selectedTabId = 'tabListOfServices'
    }

    ngOnInit(): void {
        this.stateInit()
        this.selectedServiceIdsMap= new Set(this.selectedServiceIds)        

        this.platformService.getServicesCostInfo().takeWhile(() => this.isPageRunning).subscribe(serviceCostMap => {
            this.fnGetCostByService = (serviceId) => serviceCostMap.has(serviceId) ? serviceCostMap.get(serviceId) : 0
        })        
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
        }
    };

    public selectedServiceIdsMap: Set<string>

    serviceSelectedInList(event, service, isSelected: boolean) {
        event.preventDefault()
        event.stopPropagation()
        var id=(service.data || {})._id
        if (isSelected && this.selectedServiceIdsMap.has(id)) this.selectedServiceIdsMap.delete(id)
        if (!isSelected && !this.selectedServiceIdsMap.has(id)) this.selectedServiceIdsMap.add(id)
        this.servicesSelected.next(Array.from(this.selectedServiceIdsMap.values()))
    }

    isServiceSelected(service) {
        return this.selectedServiceIdsMap.has(service.data._id)
    }

}