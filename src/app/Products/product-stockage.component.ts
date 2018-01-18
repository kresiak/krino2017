import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { ProductService } from './../Shared/Services/product.service';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import * as comparatorsUtils from './../Shared/Utils/comparators'
import * as utilsdate from './../Shared/Utils/dates'
import * as utils from './../Shared/Utils/observables'

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

    public listOfScans = ['']

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
            this.listOfScans.push('')
            this.currentPos = pos + 1
        }
    }

    onChangeMethod(pos, data) {
        this.errors[pos]=''
        var txt = data.target.value.trim()        
        this.listOfScans[+pos] = txt
        if (this.entriesMap.has(txt)) {
            var entry= this.entriesMap.get(txt)
            this.errors[pos]= "Cette étiquette existe déjà! (" + entry.annotation.productName + ' ajouté le ' +  entry.data.dateCreate + ')'
        }
        this.nbBeenAdded= this.listOfScans.filter(txt => txt.trim() && !this.entriesMap.has(txt.trim())).length
    }

    trackByFn(index, item) {
        return index; // or item.id
    }

    resetControl(pos) {
        this.listOfScans[pos] = ''
        this.nbBeenAdded= this.listOfScans.filter(txt => txt.trim() && !this.entriesMap.has(txt.trim())).length
    }

    save() {
        var newScans = this.listOfScans.filter(txt => txt.trim() && !this.entriesMap.has(txt.trim())).map(txt => {
            return {
                productId: this.productId,
                scanId: txt,
                userIdCreate: this.authorizationStatusInfo.currentUserId,
                dateCreate: utilsdate.nowFormated()
            }
        })

        Observable.forkJoin(newScans.map(entry => this.dataStore.addData('products.stockage', entry))).subscribe(res => {
            this.reset()
        })
    }

    reset() {
        this.listOfScans = ['']
        this.currentPos = 0
        this.errors= []
        this.nbBeenAdded=0
    }

    isDisabled() {
        return this.listOfScans.filter(txt => txt.trim()).length === 0
    }

    deleteEntry(stockId) {
        this.dataStore.deleteData('products.stockage', stockId)
    }

}