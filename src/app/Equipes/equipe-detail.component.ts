import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from 'gg-basic-data-services'
import { OrderService } from './../Shared/Services/order.service'
import { OtpService } from '../Shared/Services/otp.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { ProductService } from './../Shared/Services/product.service'
import { VoucherService } from '../Shared/Services/voucher.service';
import { StockService } from '../Shared/Services/stock.service';
import { Observable, Subscription } from 'rxjs/Rx'
import { UserService } from './../Shared/Services/user.service'
import { SapService } from './../Shared/Services/sap.service'
import { ChartService } from './../Shared/Services/chart.service'
import { ConfigService } from 'gg-basic-data-services'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NavigationService } from './../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { SelectableData } from 'gg-basic-code'
import * as moment from "moment"

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-equipe-detail',
        templateUrl: './equipe-detail.component.html'
    }
)
export class EquipeDetailComponent implements OnInit {

    constructor(private dataStore: DataStore, private orderService: OrderService, private userService: UserService, private chartService: ChartService,
        private voucherService: VoucherService, private navigationService: NavigationService, private authService: AuthService, private otpService: OtpService, 
        private equipeService: EquipeService, private stockService: StockService, private configService: ConfigService, private sapService: SapService) {
    }
    public pieSpentChart;

    public sapsObservableAttributed: Observable<any>;


    @Input() equipeObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false

    @Input() initialTab: string = '';
    @Output() stateChanged = new EventEmitter();

    public otpListObservable: any

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initialTab;
    }



    ngOnInit(): void {
        this.stateInit();
        this.selectableManagers = this.authService.getSelectableUsers(true);
        this.selectableUsers = this.authService.getSelectableUsers(true);
        
        this.subscriptionEquipe = this.equipeObservable.subscribe(eq => {
            this.equipe = eq;
            if (eq) {
                this.sapsObservableAttributed = this.sapService.getSapItemByEquipeObservable(this.equipe.data._id);
                
                this.pieSpentChart = this.chartService.getSpentPieData(this.equipe.annotation.amountSpent / this.equipe.annotation.budget * 100);
                this.usersObservable = this.authService.getAnnotatedUsersByEquipeId(this.equipe.data._id)
                this.otpsObservable = this.otpService.getAnnotatedOtpsByEquipe(this.equipe.data._id);
                this.ordersObservable = this.orderService.getAnnotedOrdersByEquipe(eq.data._id);
                this.orderService.hasEquipeAnyOrder(eq.data._id).first().subscribe(anyOrder => this.anyOrder = anyOrder);

                this.selectedManagerIdsObservable = Observable.from([this.equipe.data.managerIds]);
                this.selectedUserIdsObservable = Observable.from([this.equipe.data.userIds]);

                this.stockOrdersObservable = this.stockService.getAnnotatedStockOrdersByEquipe(eq.data._id)

                this.fridgeOrdersObservable = this.orderService.getAnnotatedFridgeOrdersByEquipe(eq.data._id)
                this.webVouchersObservable = this.voucherService.getAnnotatedUsedVouchersOfEquipeByDate(eq.data._id)

                this.bilanObservable = this.equipeService.getBilanForEquipe(eq.data._id)
            }
        });
        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });

        this.otpListObservable = this.dataStore.getDataObservable('otps').map(otps => otps.map(otp => {
            return {
                id: otp._id,
                name: otp.name
            }
        }));

    }

    ngOnDestroy(): void {
        this.subscriptionAuthorization.unsubscribe()
        this.subscriptionEquipe.unsubscribe()
    }



    /*    @Input() selectedTabId;
        @Output() tabChanged = new EventEmitter();
    */
    public selectableManagers: Observable<SelectableData[]>;
    public selectedManagerIdsObservable: Observable<any>;
    public selectableUsers: Observable<SelectableData[]>;
    public selectedUserIdsObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription
    public subscriptionEquipe: Subscription

    public usersObservable: Observable<any>;
    public otpsObservable: Observable<any>;
    public ordersObservable: Observable<any>;
    public fridgeOrdersObservable: Observable<any>;
    public stockOrdersObservable: Observable<any>;
    public webVouchersObservable: Observable<any>
    public bilanObservable: Observable<any>

    public equipe: any;
    public anyOrder: boolean;
    
    setDashlet() {
        this.userService.createEquipeDashletForCurrentUser(this.equipe.data._id);
    }

    removeDashlet(dashletId) {
        if (dashletId)
            this.userService.removeDashletForCurrentUser(dashletId);
    }

    userSelectionChanged(selectedIds: string[]) {
        this.equipe.data.userIds = selectedIds;
        this.dataStore.updateData('equipes', this.equipe.data._id, this.equipe.data);
    }

    managerSelectionChanged(selectedIds: string[]) {
        this.equipe.data.managerIds = selectedIds;
        this.dataStore.updateData('equipes', this.equipe.data._id, this.equipe.data);
    }

    public beforeTabChange($event: NgbTabChangeEvent) {
        if ($event.nextId === 'tabMax') {
            $event.preventDefault();
            this.navigationService.maximizeOrUnmaximize('/equipe', this.equipe.data._id, this.path, this.isRoot)
            return
        }
        if ($event.nextId === 'gotoTop') {
            $event.preventDefault();
            this.navigationService.jumpToTop()
            return
        }

        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    public childOtpsStateChanged($event) {
        this.state.Otps = $event;
        this.stateChanged.next(this.state);
    }

    public childUsersStateChanged($event) {
        this.state.Users = $event;
        this.stateChanged.next(this.state);
    }



    nameUpdated(name) {
        this.equipe.data.name = name;
        this.dataStore.updateData('equipes', this.equipe.data._id, this.equipe.data);
    }

    descriptionUpdated(name) {
        this.equipe.data.description = name;
        this.dataStore.updateData('equipes', this.equipe.data._id, this.equipe.data);
    }

    nbOfMonthAheadAllowedUpdated(nbOfMonths) {
        this.equipe.data.nbOfMonthAheadAllowed = nbOfMonths;
        this.dataStore.updateData('equipes', this.equipe.data._id, this.equipe.data);
    }

    blockedUpdated(isBlock) {
        this.equipe.data.isBlocked = isBlock;
        this.dataStore.updateData('equipes', this.equipe.data._id, this.equipe.data);
    }


}