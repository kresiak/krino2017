import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx'
import { OrderService } from './../Shared/Services/order.service'
import { SapService } from './../Shared/Services/sap.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { EquipeService } from '../Shared/Services/equipe.service';

@Component(
    {
        templateUrl: './sap-list.routable.component.html'
    }
)
export class SapListComponentRoutable implements OnInit {
    sapsObservableAttributed: Observable<any>;
    listResponsales: any;
    sapPieceTypesInfo: any[];
    constructor(private navigationService: NavigationService, private authService: AuthService, private sapService: SapService, private equipeService: EquipeService) { }

    state: {}

    public sapItemsToAttribute: any[]
    public sapItemsToAttributeAll: any[]

    public equipeListObservable: Observable<any>

    public isPageRunning: boolean = true

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    public prepareSapItemsToAttributeToEquipe() {
        this.sapService.getSapItemsToAttributeToEquipe().first().subscribe(items => {
            this.sapItemsToAttributeAll = items.filter(item => !this.sapItemtsToIgnore.has(item.sapId))
            this.sapItemsToAttribute = this.sapItemsToAttributeAll.slice(0, 10)
        })
    }

    ngOnInit(): void {
        this.sapService.allResponsables().subscribe(res => {
            this.listResponsales = res
        })

        this.navigationService.getStateObservable().takeWhile(() => this.isPageRunning).subscribe(state => {
            this.state = state
        })
        this.sapsObservable = this.sapService.getSapItemsObservable();

        this.sapsObservableAttributed = this.sapService.getSapItemEquipeAtributedObservable();

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.sapService.getSapPieceTypesInfoObservable().takeWhile(() => this.isPageRunning).subscribe(infos => {
            this.sapPieceTypesInfo = infos
        })

        this.prepareSapItemsToAttributeToEquipe()

        this.equipeListObservable = this.equipeService.getEquipesForAutocomplete()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getSapBytypeObservable(pieceType, idLength, idFirstChar) {
        return this.sapsObservable.map(items => items.filter(item => item.typesPiece === pieceType && +item.sapId.toString().length === +idLength && item.sapId.toString().startsWith(idFirstChar)))
    }

    public sapsObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo;

    public sapItemtsToIgnore = new Set<number>()

    public doIgnoreWork(sapId) {
        if (!this.sapItemtsToIgnore.has(sapId)) this.sapItemtsToIgnore.add(sapId)
    }

    equipeChanged(equipeId, sapItem) {
        if (this.sapItemtsToIgnore.has(sapItem.sapId)) this.sapItemtsToIgnore.delete(sapItem.sapId)
        if (!equipeId) this.doIgnoreWork(sapItem.sapId)

        sapItem.equipeId = equipeId
        this.sapService.updateSapEquipeAttribution(sapItem.sapId, equipeId, sapItem.description || '')
    }

    descriptionChanged(description, sapItem) {
        sapItem.description = description
        if (sapItem.equipeId)
            this.sapService.updateSapEquipeAttribution(sapItem.sapId, sapItem.equipeId, sapItem.description)
    }

    equipeChangeCancelled(sapItem) {
        if (!sapItem.equipeId) this.doIgnoreWork(sapItem.sapId)
    }

    refreshAttributionList() {
        this.prepareSapItemsToAttributeToEquipe()
    }

    getSapObservable(sapId: number) {
        return this.sapService.getSapItemObservable(sapId)
    }

}

