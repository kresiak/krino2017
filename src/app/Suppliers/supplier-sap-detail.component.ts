import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { AuthenticationStatusInfo, AuthService } from './../Shared/Services/auth.service'
import { ConfigService } from './../Shared/Services/config.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { DataStore } from './../Shared/Services/data.service'
import { SupplierService } from './../Shared/Services/supplier.service'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-supplier-sap-detail',
        templateUrl: './supplier-sap-detail.component.html'
    }
)
export class SupplierSapDetailComponent implements OnInit {
    constructor(private authService: AuthService, private supplierService: SupplierService, private dataStore: DataStore, private configService: ConfigService) {

    }

    @Input() supplierObservable: Observable<any>;
    public krinoSupplierObservable: Observable<any>
    public krinoSupplier

    ngOnInit(): void {

        this.subscriptionSupplier= this.supplierObservable.subscribe(supplier => {
            this.supplier = supplier;
            this.krinoSupplierObservable= this.supplierService.getAnnotatedSupplierBySapId(supplier.sapId)
            this.subscriptionSupplierKrino= this.krinoSupplierObservable.subscribe(s => this.krinoSupplier = s)
        });

        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo= statusInfo
        })        
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionSupplier.unsubscribe()
         this.subscriptionSupplierKrino.unsubscribe()
    }
    

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription     
    public subscriptionSupplier: Subscription  
    public subscriptionSupplierKrino: Subscription

    public supplier: any;

    public beforeTabChange($event: NgbTabChangeEvent) {
    };


    public childOrdersStateChanged($event) {
    }

    public addSupplier() {
        this.dataStore.addData('suppliers', this.supplier)
    }
}


