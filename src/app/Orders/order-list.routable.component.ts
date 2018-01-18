import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { OrderService } from './../Shared/Services/order.service'
import { SupplierService } from './../Shared/Services/supplier.service'
import { VoucherService } from '../Shared/Services/voucher.service';
import { StockService } from '../Shared/Services/stock.service';
import { Observable} from 'rxjs/Rx'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { DataStore } from 'gg-basic-data-services'

@Component(
    {
        //moduleId: module.id,
        templateUrl: './order-list.routable.component.html'
    }
)
export class OrderListComponentRoutable implements OnInit {
    laboName: string;

    private isPageRunning: boolean = true

    constructor(private voucherService: VoucherService, private orderService: OrderService, private route: ActivatedRoute, private supplierService: SupplierService,
        private navigationService: NavigationService, private authService: AuthService, private stockService: StockService, private dataStore: DataStore) { }

    state
    initTabId = ''

    ngAfterViewInit() {
        this.navigationService.jumpToOpenRootAccordionElement()
    }

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initTabId;
    }


    ngOnInit(): void {

        this.suppliersObservable = this.supplierService.getAnnotatedSuppliersByFrequence()
        this.ordersObservable = this.orderService.getAnnotedOrdersByNewest()
        this.stockOrdersObservable = this.stockService.getAnnotatedStockOrdersAll()
        this.webVouchersObservable = this.voucherService.getAnnotatedUsedVouchersByDate()

        this.navigationService.getStateObservable().takeWhile(() => this.isPageRunning).subscribe(state => {
            this.state = state
        })
        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.fridgeOrdersObservable = this.orderService.getAnnotatedFridgeOrders()

        this.route.queryParams.first().subscribe(queryParams => {
            this.initTabId = queryParams['tab'];
            this.stateInit()
        })

        this.dataStore.getLaboNameObservable().subscribe(res => {
            this.laboName = res
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public fridgeOrdersObservable: Observable<any>;
    public suppliersObservable: Observable<any>;
    public ordersObservable: Observable<any>;
    public webVouchersObservable: Observable<any>;

    public stockOrdersObservable: Observable<any>;
    public authorizationStatusInfo: AuthenticationStatusInfo;
}