import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from './../Shared/Services/data.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from './../Shared/Services/notification.service';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-reception-detail',
        templateUrl: './reception-detail.component.html'
    }
)

export class ReceptionDetailComponent implements OnInit {
    public receptionForm: FormGroup;
    public suppliersList: any;

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private notificationService: NotificationService, private _sanitizer: DomSanitizer, private authService: AuthService ) {}

    ngOnInit(): void {
        this.receptionForm = this.formBuilder.group({
            supplierId: [''],
            supplier: [''],
            reference: ['', Validators.required],
            position: ['']
        });
        
        this.supplierSubscrible = this.dataStore.getDataObservable('suppliers').subscribe(suppliers => {
            this.suppliersList = suppliers.map(supplier => {
                return {
                    id: supplier._id,
                    value: supplier.name
                }
            })
        });

        this.receptionSubscrible = this.notificationService.getAnnotatedReceptions().subscribe(receptions => {
            this.receptionList = receptions;
        });

        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    }

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.supplierSubscrible.unsubscribe()
         this.receptionSubscrible.unsubscribe()
    }
  
    public supplierSubscrible: Subscription
    public receptionList: any
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription
    public receptionSubscrible: Subscription

    save(formValue, isValid)
    {
        this.dataStore.addData('orders.reception', {
            supplier: formValue.supplier,
            reference: formValue.reference,
            position: formValue.position,
            supplierId: formValue.supplierId.id
        }).subscribe(res =>
        {
            var x=res;
            this.reset();
        });
    };

    reset()
    {
        this.receptionForm.reset();        
    };
    
    autocompleListFormatter = (data: any): SafeHtml => {
        let html = `<span>${data.value}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    };

    isProcessed(processed:boolean, reception: any) {
        reception.data.isProcessed = processed;
        this.dataStore.updateData('orders.reception', reception.data._id, reception.data);
    };

    positionUpdated(position, reception: any) {
        reception.data.position = position;
        this.dataStore.updateData('orders.reception', reception.data._id, reception.data);
    };

    referenceUpdated(reference, reception: any) {
        reception.data.reference = reference;
        this.dataStore.updateData('orders.reception', reception.data._id, reception.data);
    };

}
