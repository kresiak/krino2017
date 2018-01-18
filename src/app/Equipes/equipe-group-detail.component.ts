import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from './../Shared/Services/data.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { Observable, Subscription } from 'rxjs/Rx'
import { UserService } from './../Shared/Services/user.service'
import { ChartService } from './../Shared/Services/chart.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NavigationService } from './../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-equipe-group-detail',
        templateUrl: './equipe-group-detail.component.html'
    }
)
export class EquipeGroupDetailComponent implements OnInit {
    constructor(private dataStore: DataStore, private equipeService: EquipeService, private authService: AuthService) {
    }

    @Input() equipeGroupObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false

    @Input() initialTab: string = '';
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initialTab;
    }

    public selectableEquipes: Observable<any>;
    public selectedEquipeIdsObservable

    ngOnInit(): void {
        this.stateInit();
        this.subscriptionGroup= this.equipeGroupObservable.subscribe(eq => {
            this.equipeGroup = eq;
        });

        this.selectableEquipes = this.equipeService.getSelectableEquipes();
        this.selectedEquipeIdsObservable = this.equipeGroupObservable.map(group => group.data.equipeIds.map(idObj => idObj.id));

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionGroup.unsubscribe()
    }
    

    /*    @Input() selectedTabId;
        @Output() tabChanged = new EventEmitter();
    */
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription
    public subscriptionGroup: Subscription
    public equipeGroup: any;

    public beforeTabChange($event: NgbTabChangeEvent) {
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    nameUpdated(name) {
        this.equipeGroup.data.name = name;
        this.dataStore.updateData('equipes.groups', this.equipeGroup.data._id, this.equipeGroup.data);
    }

    descriptionUpdated(name) {
        this.equipeGroup.data.description = name;
        this.dataStore.updateData('equipes.groups', this.equipeGroup.data._id, this.equipeGroup.data);
    }

    equipeSelectionChanged(selectedEquipeIds: string[]) {
        this.equipeGroup.data.equipeIds = this.equipeGroup.data.equipeIds.filter(element => selectedEquipeIds.includes(element.id))

        selectedEquipeIds.filter(id => !this.equipeGroup.data.equipeIds.map(element => element.id).includes(id)).forEach(id => {
            this.equipeGroup.data.equipeIds.push({
                id: id,
                weight: 1
            })
        })
        this.dataStore.updateData('equipes.groups', this.equipeGroup.data._id, this.equipeGroup.data);
    }

    weightupdated(item, newQuantity: string) {
        item.weight = newQuantity
        this.dataStore.updateData('equipes.groups', this.equipeGroup.data._id, this.equipeGroup.data);
    }

}