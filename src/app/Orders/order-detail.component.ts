import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { OrderService } from '../Shared/Services/order.service'
import { DataStore } from 'gg-basic-data-services'
import { Observable, BehaviorSubject, Subscription } from 'rxjs/Rx'
import { UserService } from './../Shared/Services/user.service'
import { NgbTabChangeEvent, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { NavigationService } from './../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { EquipeService } from '../Shared/Services/equipe.service';

import * as moment from "moment"
import * as comparatorsUtils from './../Shared/Utils/comparators'
import * as dateUtils from './../Shared/Utils/dates'


@Component(
    {
        //moduleId: module.id,
        selector: 'gg-order-detail',
        templateUrl: './order-detail.component.html'
    }
)
export class OrderDetailComponent implements OnInit {
    constructor(private orderService: OrderService, private route: ActivatedRoute, private userService: UserService, private authService: AuthService, private equipeService: EquipeService,
        private dataStore: DataStore, private elementRef: ElementRef, private modalService: NgbModal, private router: Router, private navigationService: NavigationService) {

    }

    @Input() orderObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false

    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = '';
    }


    public smallScreen: boolean;
    public authorizationStatusInfo: AuthenticationStatusInfo;
    public subscriptionAuthorization: Subscription
    public subscriptionOrder: Subscription

    public otpListObservable: any
    public equipeListObservable

    public processDeliverySaveButton: boolean= false


    ngOnInit(): void {
        this.stateInit();
        this.smallScreen = this.elementRef.nativeElement.querySelector('.orderDetailClass').offsetWidth < 600;

        this.otpListObservable = this.dataStore.getDataObservable('otps').map(otps => otps.map(otp => {
            return {
                id: otp._id,
                name: otp.name
            }
        }));

        this.equipeListObservable = this.equipeService.getEquipesForAutocomplete()

        this.subscriptionOrder = this.orderObservable.subscribe(order => {
            if (!comparatorsUtils.softCopy(this.order, order))
                this.order= order
        });
        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });

    }

    ngOnDestroy(): void {
        this.subscriptionAuthorization.unsubscribe()
        this.subscriptionOrder.unsubscribe()
    }

    public SaveDeliveryItems(deliveryItems) {
        if (!this.processDeliverySaveButton) return
        this.processDeliverySaveButton= false
        var self = this

        this.dataStore.getDataObservable('products.stock').first().subscribe(stockItems => {
            var stockSaveTaskList: Observable<any>[] = []

            var prepareDeliveryDataForOrder = function (qty: number): any {
                return {
                    quantity: qty,
                    date: dateUtils.nowFormated(),
                    userId: self.authorizationStatusInfo.currentUserId
                };
            }

            var doStockWorkAndPrepareObservable = function (stockItems, orderId, orderItem, qty, lot, fnSetStockIdOnOrderDeliveryItem) {
                let qtyInStock = +qty * +orderItem.annotation.stockDivisionFactor
                let prodData = {
                    productId: orderItem.data.productId,
                    quantity: qtyInStock,
                    divisionFactor: orderItem.annotation.stockDivisionFactor,
                    package: orderItem.annotation.stockPackaging,
                    lotNumber: lot,
                    history: [{ userId: self.authorizationStatusInfo.currentUserId, date: dateUtils.nowFormated(), quantity: qtyInStock, orderId: orderId }]
                };
                let stockItem = stockItems.filter(si => si.productId === prodData.productId && si.divisionFactor === prodData.divisionFactor
                    && si.package === prodData.package && si.lotNumber === prodData.lotNumber)[0]
                if (stockItem) {
                    stockItem.quantity += prodData.quantity;
                    (stockItem.history = stockItem.history || []).push(prodData.history[0])
                    fnSetStockIdOnOrderDeliveryItem(stockItem._id)
                    stockSaveTaskList.push(self.dataStore.updateData('products.stock', stockItem._id, stockItem))
                }
                else {
                    var obs = self.dataStore.addData('products.stock', prodData).first().do(res => fnSetStockIdOnOrderDeliveryItem(res._id))
                    stockSaveTaskList.push(obs)
                }
            }

            deliveryItems.filter(tmpItem => +tmpItem.nbDelivered && +tmpItem.nbDelivered > 0 && +tmpItem.nbDelivered <= (tmpItem.nbOrdered - tmpItem.nbAlready)).forEach(tmpItem => {
                var orderItem = tmpItem.item    // this is the window on part of this.order.data that will be modified
                if (!orderItem.data.deliveries) orderItem.data.deliveries = [];
                var deliveryDataForOrder: any = prepareDeliveryDataForOrder(+tmpItem.nbDelivered)
                if (orderItem.annotation.needsLotNumber) deliveryDataForOrder.lotNb = tmpItem.noLot
                orderItem.data.deliveries.push(deliveryDataForOrder)
                if (orderItem.annotation.isStockProduct && tmpItem.isForStock)
                    doStockWorkAndPrepareObservable(stockItems, this.order.data._id, orderItem, +tmpItem.nbDelivered, tmpItem.noLot, stockId => deliveryDataForOrder.stockId = stockId)
            })

            if (stockSaveTaskList.length > 0) {
                Observable.forkJoin(stockSaveTaskList).subscribe(res => {
                    this.dataStore.updateData('orders', this.order.data._id, this.order.data);
                })
            }
            else {
                this.dataStore.updateData('orders', this.order.data._id, this.order.data);
            }
        })
    }

    public tmpDeliveryItems;



    openModal(template) {
        this.processDeliverySaveButton=true
        this.tmpDeliveryItems = this.order.annotation.items.map(item => {

            var obj: any = {
                item: item,
                product: item.annotation.description,
                catalogNr: item.annotation.catalogNr,
                nbOrdered: item.data.quantity,
                nbAlready: item.annotation.nbDelivered,
                nbDelivered: 0,
            }
            if (item.annotation.needsLotNumber) obj.noLot = '-'
            if (item.annotation.isStockProduct) {
                obj.stockPackaging = item.annotation.stockPackaging
                obj.isForStock = false
            }

            return obj
        });
        var ref = this.modalService.open(template, { keyboard: false, backdrop: "static", size: "lg" });
        var promise = ref.result;
        promise.then((data) => {
            this.SaveDeliveryItems(this.tmpDeliveryItems)
            this.tmpDeliveryItems = undefined;
        }, (res) => {
        });
        promise.catch((err) => {
        });
    }

    equipeChanged(newid) {
        if (!newid) return
        this.order.data.equipeId = newid;
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }

    authorizeOrder() {
        this.order.data.validatedSteps.push(this.order.data.pendingValidation)
        this.order.data.pendingValidation = ''
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }

    quantityChanged(item, newQuantity) {
        item.data.quantity = newQuantity;
        item.data.total= item.annotation.price * newQuantity *  (1 + (item.annotation.tva == 0 ? 0 : item.annotation.tva || 21) / 100) * item.annotation.exchangeRate
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }

    public order;

    otpUpdated(orderItem, newOtpId): void {
        if (newOtpId && newOtpId.length > 0) {
            orderItem.data.otpId = newOtpId;
            this.dataStore.updateData('orders', this.order.data._id, this.order.data);
        }
    }

    updateTotalAmount(orderItem, newAmount): void {
        if (+newAmount) {
            orderItem.data.total = +newAmount;
            this.dataStore.updateData('orders', this.order.data._id, this.order.data);
        }
    }

    updateComment(item, newComment) {
        item.data.comment = newComment;
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }

    setDashlet() {
        this.userService.createOrderDashletForCurrentUser(this.order.data._id);
    }

    removeDashlet(dashletId) {
        if (dashletId)
            this.userService.removeDashletForCurrentUser(dashletId);
    }

    navigateToProduct(productId) {
        this.navigationService.maximizeOrUnmaximize('/product', productId, this.path, false)
    }

    navigateToOtp(otpId) {
        this.navigationService.maximizeOrUnmaximize('/otp', otpId, this.path, false)
    }

    navigateToSap(sapId) {
        this.navigationService.maximizeOrUnmaximize('/sap', sapId, this.path, false)
    }


    public getStatusList() {
        var choice = ['Received by SAP', 'Sent to Supplier', 'deleted', 'created']
        if (!choice.includes(this.order.annotation.status)) choice.push(this.order.annotation.status)
        return choice
    }

    public updateStatus(newStatus) {
        if (!this.order.data.status) this.order.data.status = { history: [] }
        this.order.data.status.history.unshift({ date: dateUtils.nowFormated(), value: newStatus, by: this.authorizationStatusInfo.getCurrentUserName() })
        this.order.data.status.value = newStatus
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }

    deleteOrder() {
        this.updateStatus('deleted')
    }

    statusChanged(newStatus) {
        if (newStatus === this.order.data.status.value) return
        if (!this.getStatusList().includes(newStatus)) return
        this.updateStatus(newStatus)
    }

    quantityDetailUpdated(quantity: string, orderItem, detailItem) {
        if (!+quantity) return
        detailItem.data.quantity = +quantity
        orderItem.data.quantity = (orderItem.data.detail || []).reduce((acc, i) => acc + i.quantity, 0)
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }


    public beforeTabChange($event: NgbTabChangeEvent) {
        if ($event.nextId === 'tabMax') {
            $event.preventDefault();
            this.navigationService.maximizeOrUnmaximize('/order', this.order.data._id, this.path, this.isRoot)
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

    deteteDeliveryItem(orderItem, deliveryItem) {
        var stockId = deliveryItem.data.stockId
        var qty = +deliveryItem.data.quantity

        if (stockId) {
            this.dataStore.getDataObservable('products.stock').first().subscribe(stockProducts => {
                var stockItem = stockProducts.filter(sp => sp._id === stockId)[0]
                if (stockItem) {
                    let qtyInStock = qty * +orderItem.annotation.stockDivisionFactor
                    stockItem.quantity -= qtyInStock;
                    (stockItem.history = stockItem.history || []).push(
                        {
                            userId: this.authorizationStatusInfo.currentUserId,
                            date: dateUtils.nowFormated(),
                            quantity: -qtyInStock,
                            orderId: this.order.data._id
                        })
                    this.dataStore.updateData('products.stock', stockItem._id, stockItem)
                }
            })
        }
        var pos = orderItem.annotation.deliveries.indexOf(deliveryItem)
        if (pos >= 0) orderItem.data.deliveries.splice(pos, 1)  // Here we don't delete on the same array we used to find the position. This was necessary because after  Softcopy we cannot rely anymore on egality of memory addresses between deliveryItem in annotation and in data.
                                        // but the sort order of the two arrays should be the same, so we can delete in that way
        this.dataStore.updateData('orders', this.order.data._id, this.order.data);
    }
}




