import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { OrderService } from './../Shared/Services/order.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { ProductService } from './../Shared/Services/product.service'
import { StockService } from '../Shared/Services/stock.service';
import { VoucherService } from '../Shared/Services/voucher.service';
import { NavigationService } from '../Shared/Services/navigation.service'
import { SupplierService } from './../Shared/Services/supplier.service'
import { DataStore } from 'gg-basic-data-services'
import { Observable, Subscription } from 'rxjs/Rx'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationStatusInfo, AuthService } from './../Shared/Services/auth.service'


@Component(
    {
        //moduleId: module.id,
        templateUrl: './mykrino.component.html'
    }
)
export class MyKrinoComponent implements OnInit {
    constructor(private orderService: OrderService, private productService: ProductService, private authService: AuthService, private dataStore: DataStore,
        private supplierService: SupplierService, private navigationService: NavigationService, private equipeService: EquipeService,
        private stockService: StockService, private voucherService: VoucherService) { }

    public ordersObservable: Observable<any>;
    public fridgeOrdersObservable: Observable<any>;
    public stockOrdersObservable: Observable<any>;
    public productsObservable: Observable<any>;
    public webSuppliersObservable: Observable<any>
    public webVouchersObservable: Observable<any>

    public suppliersWithBasketObservable: Observable<any>;
    public suppliersWithNonUrgentBasketObservable: Observable<any>;


    public equipesObservable: Observable<any>
    public currentUser;
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription
    public subscriptionCurrentUser: Subscription
    public subscriptionState: Subscription     


    @Input() state;
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = '';
    }


    ngOnInit(): void {
        this.stateInit();

        this.subscriptionState= this.navigationService.getStateObservable().subscribe(state => {
            this.state= state
        })        
        
        this.suppliersWithBasketObservable = this.supplierService.getAnnotatedSupplierseWithBasketForCurrentUser()

        this.suppliersWithNonUrgentBasketObservable = this.supplierService.getAnnotatedSupplierseWithCurrentUserParticipationInGroupsOrder()

        this.ordersObservable = this.orderService.getAnnotedOrdersOfCurrentUser();

        this.stockOrdersObservable = this.stockService.getAnnotatedStockOrdersByCurrentUser()

        this.fridgeOrdersObservable = this.orderService.getAnnotatedFridgeOrdersByCurrentUser()

        this.productsObservable = this.productService.getAnnotatedProductsBoughtByCurrentUser();
        this.subscriptionCurrentUser = this.authService.getAnnotatedCurrentUser().subscribe(res => {
            this.currentUser = res;
        });
        this.webSuppliersObservable = this.supplierService.getAnnotatedWebSuppliers()

        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
            this.equipesObservable= this.equipeService.getAnnotatedEquipesOfUser(statusInfo.currentUserId)
        });
        this.webVouchersObservable = this.voucherService.getAnnotatedUsedVouchersOfCurrentUserByDate()
    }

    ngOnDestroy(): void {
        this.subscriptionAuthorization.unsubscribe()
        this.subscriptionCurrentUser.unsubscribe()
        this.subscriptionState.unsubscribe()
    }


    commentsUpdated(comments) {
        if (this.currentUser && comments) {
            this.currentUser.data.notes = comments;
            this.dataStore.updateData('users.krino', this.currentUser.data._id, this.currentUser.data);
        }
    }

    public beforeTabChange($event: NgbTabChangeEvent) {
        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    // This is typically used for accordions with ngFor and tabsets in the cild component. As the ngFor disposes and recreates the child component, we need a way to remember the opened tab
    public childStateChanged(newState, objectId) {
        this.state[objectId] = newState;
        this.stateChanged.next(this.state);
    }

    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    public childEquipesStateChanged($event) {
        this.state.Equipes = $event;
        this.stateChanged.next(this.state);
    }

    public childBasketsStateChanged($event) {
        this.state.Baskets = $event;
        this.stateChanged.next(this.state);
    }
    public childNonUrgentBasketsStateChanged($event) {
        this.state.NonUrgentBaskets = $event;
        this.stateChanged.next(this.state);
    }



    public childProductsStateChanged($event) {
        this.state.Products = $event;
        this.stateChanged.next(this.state);
    }    


    firstNameUpdated(firstName) {
        this.currentUser.data.firstName = firstName;
        this.dataStore.updateData('users.krino', this.currentUser.data._id, this.currentUser.data);
    };

    nameUpdated(name) {
        this.currentUser.data.name = name;
        this.dataStore.updateData('users.krino', this.currentUser.data._id, this.currentUser.data);
    };

    emailUpdated(email) {
        this.currentUser.data.email = email;
        this.dataStore.updateData('users.krino', this.currentUser.data._id, this.currentUser.data);
    };

    passwordUpdated(password) {
        this.currentUser.data.password = password;
        this.dataStore.updateData('users.krino', this.currentUser.data._id, this.currentUser.data);
    };

}

