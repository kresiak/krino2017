import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { ProductService } from './../Shared/Services/product.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import {utilsDates as utilsdate} from 'gg-basic-code'
import {utilsObservables as utils} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-product-stockage',
        templateUrl: './product-stockage.component.html'
    }
)

export class ProductStockageComponent implements OnInit {
    entriesMap: Map<string,any>;
    usersMap: any;
    currentPos: number = 0
    entries: any;
    nbInstock: number=0
    nbBeenAdded: number=0
    constructor(private dataStore: DataStore, private productService: ProductService, private authService: AuthService) {
    }

    @Input() productId: string

    public authorizationStatusInfo: AuthenticationStatusInfo

    public isPageRunning: boolean = true

    private emptyScan= () => comparatorsUtils.clone({id: '', lot: ''})

    public listOfScans = [this.emptyScan()]

    public errors = []

    ngOnInit(): void {
        this.dataStore.getDataObservable('products.stockage').takeWhile(() => this.isPageRunning).map(stockages => stockages.filter(s => s.productId === this.productId))
            .do(entries => {
                this.entries = entries
                this.nbInstock= entries.filter(e => !e.dateOut).length                
            }).subscribe(res => { })

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.authService.getAnnotatedUsers().takeWhile(() => this.isPageRunning).subscribe(users => {
            this.usersMap = utils.hashMapFactoryForAnnotated(users)
        })

        this.productService.getStockageEntriesMapObservableByScanId().takeWhile(() => this.isPageRunning)
            .subscribe(entriesMap => {
                this.entriesMap = entriesMap
            })    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getUserName(uid) {
        if (!uid) return ''
        if (this.usersMap && this.usersMap.has(uid)) return this.usersMap.get(uid).annotation.fullName
        return 'unknown'
    }

    onBlurMethod(pos, data) {
        if (!this.listOfScans[+pos]) return
        if (pos === this.listOfScans.length - 1) {
            this.listOfScans.push(this.emptyScan())
            this.currentPos = pos + 1
        }
    }

    private getRelevantScans() {
        return this.listOfScans.filter(line => line.id.trim() && !this.entriesMap.has(line.id.trim()))
    }

    onChangeIdMethod(pos, data) {
        this.errors[pos]=''
        var txt = data.target.value.trim()        
        this.listOfScans[+pos].id = txt
        if (this.entriesMap.has(txt)) {
            var entry= this.entriesMap.get(txt)
            this.errors[pos]= "Cette étiquette existe déjà! (" + entry.annotation.productName + ' ajouté le ' +  entry.data.dateCreate + ')'
        }
        this.nbBeenAdded= this.getRelevantScans().length
    }

    onChangeLotMethod(pos, data) {
        var txt = data.target.value.trim()        
        this.listOfScans[+pos].lot = txt
    }
    
    trackByFn(index, item) {
        return index; // or item.id
    }

    resetControl(pos) {
        this.listOfScans[pos] = this.emptyScan()
        this.nbBeenAdded= this.getRelevantScans().length
    }

    save() {
        var newScans = this.getRelevantScans().map(line => {
            return {
                productId: this.productId,
                scanId: line.id,
                lot: line.lot,
                userIdCreate: this.authorizationStatusInfo.currentUserId,
                dateCreate: utilsdate.nowFormated()
            }
        })

        Observable.forkJoin(newScans.map(entry => this.dataStore.addData('products.stockage', entry))).subscribe(res => {
            this.reset()
        })
    }

    reset() {
        this.listOfScans = [this.emptyScan()]
        this.currentPos = 0
        this.errors= []
        this.nbBeenAdded=0
    }

    isDisabled() {
        return this.listOfScans.filter(line => line.id.trim()).length === 0
    }

    deleteEntry(stockId) {
        this.dataStore.deleteData('products.stockage', stockId)
    }

}