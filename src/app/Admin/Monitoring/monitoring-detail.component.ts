import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { SelectableData } from '../../Shared/Classes/selectable-data'
import { EquipeService } from '../../Shared/Services/equipe.service';
import { OtpService } from '../../Shared/Services/otp.service'
import { ProductService } from '../../Shared/Services/product.service'
import { NotificationService } from '../../Shared/Services/notification.service'

import { DataStore } from 'gg-basic-data-services';
//import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationStatusInfo, AuthService } from '../../Shared/Services/auth.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-monitoring-detail',
        templateUrl: './monitoring-detail.component.html'
    }
)

export class MonitoringDetailComponent implements OnInit {

    constructor(private equipeService: EquipeService, private productService: ProductService, private authService: AuthService, private dataStore: DataStore, 
                    private otpService: OtpService, private notificationService: NotificationService ) {}

    ngOnInit(): void {
        this.selectableUsers = this.authService.getSelectableUsers();
        this.selectableEquipes = this.equipeService.getSelectableEquipes();
        this.selectableCategoriesObservable = this.productService.getSelectableCategories();
        this.selectableOtps = this.otpService.getSelectableOtps();

        this.subscribeConfig= this.notificationService.getAdminMonitorForCurrentUser().subscribe(res => {
            this.config= res

            this.userIds= Observable.from([this.config.user.ids])
            this.equipeIds= Observable.from([this.config.equipe.ids])
            this.otpIds= Observable.from([this.config.otp.ids])
            this.categoryIds= Observable.from([this.config.category.ids])
        })
    }

    ngOnDestroy(): void {
         this.subscribeConfig.unsubscribe()
    }

    public selectableUsers: Observable<SelectableData[]>;
    public selectableEquipes: Observable<any>;
    public selectableCategoriesObservable: Observable<any>;
    public selectableOtps: Observable<SelectableData[]>;

    public subscribeConfig: Subscription
    public config
    public userIds
    public equipeIds
    public otpIds
    public categoryIds

    userSelectionChanged(selectedIds: string[]) {
        this.config.user.ids = selectedIds;
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    userExpensesChanged(sumUser) {
        this.config.user.amount= sumUser
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    equipeSelectionChanged(selectedIds: string[]) {
        this.config.equipe.ids = selectedIds;
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    equipeExpensesChanged(sumEquipe) {
        this.config.equipe.amount= sumEquipe
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    categorySelectionChanged(selectedIds: string[]) {
        this.config.category.ids = selectedIds;
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    categoryExpensesChanged(sumCategory) {
        this.config.category.amount= sumCategory
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    otpSelectionChanged(selectedIds: string[]) {
        this.config.otp.ids = selectedIds;
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    otpExpensesChanged(sumOtp) {
        this.config.otp.amount= sumOtp
        if (this.config._id) this.dataStore.updateData('admin.monitor', this.config._id, this.config)
        if (!this.config._id) this.dataStore.addData('admin.monitor', this.config)
    }

    

}
