import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { ConfigService } from 'gg-basic-data-services'
import { NavigationService } from './../Shared/Services/navigation.service'
import { OrderService } from './../Shared/Services/order.service'
import { VoucherService } from '../Shared/Services/voucher.service';
import { StockService } from '../Shared/Services/stock.service';
import { EquipeService } from '../Shared/Services/equipe.service';


@Component(
    {
        selector: 'gg-user-detail',
        templateUrl: './user-detail.component.html'
    }
)

export class UserDetailComponent implements OnInit {
    constructor(private dataStore: DataStore, private authService: AuthService, private navigationService: NavigationService, private orderService: OrderService, 
                private voucherService: VoucherService, private equipeService: EquipeService, private stockService: StockService, private configService: ConfigService) {
    }

    @ViewChild('uploader') imageUploadComponent;

    @Input() userObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean= false
    @Output() stateChanged = new EventEmitter()

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = '';
    }

    ngOnInit(): void {
        this.stateInit();
         this.subscriptionUser=this.userObservable.subscribe(user => {
            if (!user) return
            this.user = user;
            this.equipesObservable= this.equipeService.getAnnotatedEquipesOfUser(user.data._id)
            this.ordersObservable = this.orderService.getAnnotedOrdersByUser(user.data._id)
            this.fridgeOrdersObservable= this.orderService.getAnnotatedFridgeOrdersByUser(user.data._id)
            this.stockOrdersObservable= this.stockService.getAnnotatedStockOrdersByUser(user.data._id)
            this.webVouchersObservable= this.voucherService.getAnnotatedUsedVouchersOfUserByDate(user.data._id)
        });
        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    };

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionUser.unsubscribe()
    }
    
    public user
    public webVouchersObservable: Observable<any>
    public stockOrdersObservable: Observable<any>;    
    public equipesObservable: Observable<any>
    public ordersObservable: Observable<any>
    public fridgeOrdersObservable: Observable<any>
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription     
    public subscriptionUser: Subscription         

    public beforeTabChange($event: NgbTabChangeEvent) {
        if ($event.nextId === 'tabMax') {
            $event.preventDefault();
            this.navigationService.maximizeOrUnmaximize('/user', this.user.data._id, this.path, this.isRoot)
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

    public childEquipesStateChanged($event) {
        this.state.Equipes = $event;
        this.stateChanged.next(this.state);
    }

    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    public childStockOrdersStateChanged($event) {
        this.state.StockOrders = $event;
        this.stateChanged.next(this.state);
    }

    isBlockedUpdated(isBlocked) {
        this.user.data.isBlocked = isBlocked;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

    isLaboUserUpdated(isLabo) {
        this.user.data.isLaboUser = isLabo;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

    isAdminUpdated(isAdmin) {
        this.user.data.isAdmin = isAdmin;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

    isSuperAdminUpdated(isAdmin) {
        this.user.data.isSuperAdmin = isAdmin;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);        
    }

    isReceptionistUpdated(receptionist) {
        this.user.data.isReceptionist = receptionist;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    }

    isLabManagerUpdated(labManager) {
        this.user.data.isLabManager = labManager;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    }

    isProgrammerUpdated(isProgrammer) {
        this.user.data.isProgrammer = isProgrammer;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    }

    isPlatformAdminUpdated(isPlatformAdmin) {
        this.user.data.isPlatformAdmin = isPlatformAdmin;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    }

    isPassiveUserUpdated(isPassiveUser) {
        this.user.data.isPassiveUser = isPassiveUser;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    }

    isOtpAwareUserUpdated(isOtpAwareUser) {
        this.user.data.isOtpAware = isOtpAwareUser;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    }

    onUploadFinished(documents) {
        if (documents && documents.length>0) {
            this.user.data.pictureFile= documents[0].filename
            this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
            this.imageUploadComponent.clearPictures()
        }
    }
}