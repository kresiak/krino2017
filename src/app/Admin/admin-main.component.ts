import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { Observable } from 'rxjs/Rx'
import { ActivatedRoute } from '@angular/router'
import { DataStore } from '../Shared/Services/data.service'
import { SapService } from '../Shared/Services/sap.service'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './admin-main.component.html'
    }
)

export class AdminMainComponent {
    currencyList: any[];
    laboList: any[];
    responsablesSelectable: Observable<any>;
    constructor(private dataStore: DataStore, private authService: AuthService, private route: ActivatedRoute, private sapService: SapService) {

    }

    public authorizationStatusInfo: AuthenticationStatusInfo;

    public isPageRunning: boolean = true

    @Input() state;
    @Output() stateChanged = new EventEmitter()

    initTabId = ''
    initTabId2 = ''

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = '';
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    ngOnInit(): void {
        this.stateInit();

        this.route.queryParams.first().subscribe(queryParams => {
            this.initTabId = queryParams['tab'];
            this.initTabId2 = queryParams['tab2'];
        })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.responsablesSelectable = this.sapService.allResponsablesSelectable()

        this.dataStore.getDataObservable('labos.list').takeWhile(() => this.isPageRunning).subscribe(res => {
            this.laboList = res
        })

        this.dataStore.getDataObservable('currencies').takeWhile(() => this.isPageRunning).subscribe(res => {
            this.currencyList = res
        })
    }

    selectedRespIdsObservable(laboId) {
        return this.dataStore.getDataObservable('labos.list').map(labos => labos.filter(l => l._id === laboId)[0]).map(theLabo => theLabo ? (theLabo.responsables || []) : [])
    }

    nameLaboUpdated(newName, labo) {
        if (!newName) return
        labo.name = newName
        this.dataStore.updateData('labos.list', labo._id, labo)
    }

    shortcutLaboUpdated(newName, labo) {
        if (!newName) return
        labo.shortcut = newName
        this.dataStore.updateData('labos.list', labo._id, labo)
    }

    responsablesSelectionChanged(newIds, labo) {
        labo.responsables = newIds
        this.dataStore.updateData('labos.list', labo._id, labo)
    }

    public beforeTabChange($event: NgbTabChangeEvent) {
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public nameCurrencyUpdated(newName, currency) {
        if (!newName) return
        currency.name = newName
        this.dataStore.updateData('currencies', currency._id, currency)
    }

    public conversionToEuroUpdated(conversion, currency) {
        if (!+conversion) return
        currency.conversionToEuro = +conversion
        this.dataStore.updateData('currencies', currency._id, currency)
    }

    
}