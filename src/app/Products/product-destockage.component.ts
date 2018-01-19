import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { ProductService } from './../Shared/Services/product.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import {utilsComparators as comparatorsUtils} from 'gg-basic-code'
import {utilsDates as utilsdate} from 'gg-basic-code'
import * as utils from './../Shared/Utils/observables'

@Component(
    {
        selector: 'gg-product-destockage',
        templateUrl: './product-destockage.component.html'
    }
)

export class ProductDeStockageComponent implements OnInit {
    usersMap: any;
    currentPos: number = 0;
    entriesMap: Map<string, any>;

    constructor(private dataStore: DataStore, private productService: ProductService, private authService: AuthService) {
    }

    public authorizationStatusInfo: AuthenticationStatusInfo

    public isPageRunning: boolean = true

    public emptyObjFn= () => {return { id: '', description: {} }}
    public initialArrFn= () => {return [this.emptyObjFn()]}

    public listOfScans = this.initialArrFn()

    ngOnInit(): void {
        this.productService.getStockageEntriesMapObservableByScanId().takeWhile(() => this.isPageRunning)
            .subscribe(entriesMap => {
                this.entriesMap = entriesMap
            })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public getDescription(id): any {
        var fnGetReturn= (txt, storageEntry: any= undefined) => {
            return {
                info: txt,
                storageEntry: storageEntry
            }
        }

        if (!this.entriesMap || !this.entriesMap.has(id)) return fnGetReturn('Cet identifiant est inconnu')

        var entry = this.entriesMap.get(id)

        if (entry.annotation.isAlreadyOut) return fnGetReturn('Déjà déstoqué (' + entry.data.dateOut + ')')

        return fnGetReturn(entry.annotation.productName + ' (in: ' + entry.data.createDate + ')' + ' : ' + entry.annotation.nbInStock + ' left' , entry.data)
    }

    onBlurMethod(pos, data) {
        if (!this.listOfScans[+pos] || !this.listOfScans[+pos].id) return

        this.listOfScans[+pos].description = this.getDescription(this.listOfScans[+pos].id)

        if (pos === this.listOfScans.length - 1) {
            this.listOfScans.push(this.emptyObjFn())
            this.currentPos = pos + 1
        }
    }

    onChangeMethod(pos, data) {
        var txt = data.target.value.trim()
        this.listOfScans[+pos].id = txt
    }

    trackByFn(index, item) {
        return index; // or item.id
    }

    resetControl(pos) {
        if (this.listOfScans[pos]) {
            this.listOfScans[pos]=this.emptyObjFn()
        }
    }

    save() {
        this.listOfScans.filter(s => s.id).forEach(s => {
            s.description= this.getDescription(s.id)
        })

        var observables=this.listOfScans.filter(s => s.id && s.description && s.description['storageEntry']).map(s => {
            var entry= s.description['storageEntry']
            entry.userIdOut= this.authorizationStatusInfo.currentUserId
            entry.dateOut= utilsdate.nowFormated()
            return this.dataStore.updateData('products.stockage', entry._id, entry)
        })

        Observable.forkJoin(observables).subscribe(res => {
            this.reset()
        })        
    }

    reset() {
        this.listOfScans = this.initialArrFn()
        this.currentPos = 0
    }

    isDisabled() {
        var arr= this.listOfScans.filter(s => s.id).map(s => this.getDescription(s.id))
        return arr.filter(r => r.storageEntry).length === 0 || arr.filter(r => !r.storageEntry).length > 0
    }

}