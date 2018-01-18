import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { AuthenticationStatusInfo, AuthService } from './../Shared/Services/auth.service'
import { DataStore } from './../Shared/Services/data.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-supplier-eproc-shopping',
        templateUrl: './supplier-eproc-shopping.html'
    }
)
export class SupplierEprocShoppingComponent implements OnInit {
    constructor(private dataStore: DataStore, private authService: AuthService) {

    }

    @Input() supplier: any
    @Output() isDone= new EventEmitter()

    private isPageRunning: boolean = true

    ngOnInit(): void {
        this.eprocData = false

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    private authorizationStatusInfo: AuthenticationStatusInfo;
    public eprocData = false

    eprocDataChanged(data) {
        if (this.eprocData !== data) this.eprocData = data
    }

    eprocHasBeenDone(eprocData) {
        if (!eprocData) return
        eprocData.supplierId = this.supplier.data._id
        eprocData.userId = this.authorizationStatusInfo.currentUserId
        this.dataStore.addData('orders.eproc', eprocData).subscribe(res => {
            this.isDone.next()
        })
    }
}
