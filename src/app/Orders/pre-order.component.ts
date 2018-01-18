import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { BasketService } from './../Shared/Services/basket.service'
import { OrderService } from './../Shared/Services/order.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { SupplierService } from './../Shared/Services/supplier.service'
import { AdminService } from './../Shared/Services/admin.service'
import { AuthenticationStatusInfo, AuthService } from './../Shared/Services/auth.service'
import { Observable } from 'rxjs/Rx'

@Component(
    {
        templateUrl: './pre-order.component.html'
    }
)
export class PreOrderComponent implements OnInit {
        nbLinesNonDisabled: any;
    constructor(private orderService: OrderService, private supplierService: SupplierService, private basketService: BasketService, private route: ActivatedRoute, 
                private authService: AuthService, private equipeService: EquipeService, private adminService: AdminService, private router: Router) {

    }

    public groupsForSelectionObservable: Observable<any>
    public groups: any[]
    public authorizationStatusInfo: AuthenticationStatusInfo;

    public isEnoughBudget: boolean = false
    public isTotalUnderLimit: boolean = false
    public isGroupOrdersUser: boolean = false

    public isOtpOk: boolean = false
    public isSubmitButtonFree: boolean = true

    public maximumSpendingAccepted: number= 500

    public isPageRunning: boolean= true

    ngOnInit(): void {
        this.route.params.switchMap((params: Params) => {
            let supplierId = params['id']
            return this.supplierService.getSupplier(supplierId)
        })
        .filter(supplier => supplier)
        .do(supplier => {
            this.supplier= supplier
            this.basketService.addFixCostToBasket(supplier._id)
        })
        .map(supplier => this.basketService.getAnnotatedProductsInCurrentUserBasketBySupplierWithOtp(supplier._id))
        .do(productObervable => {
            this.productsBasketObservable= productObervable
        })
        .switchMap(productObervable => {
            return productObervable.takeWhile(() => this.isPageRunning)   //takeWhile necessary on each starting observable path  (otherwise will survive the page)
        })        
        .do(products => {
            this.productsInBasket = products
            this.isOtpOk = products.filter(product => product.annotation.otp && !product.annotation.otp._id).length == 0            
        })
        .combineLatest(
            this.authService.getStatusObservable().takeWhile(() => this.isPageRunning)    //takeWhile necessary on each starting observable path
                .do((statusInfo) => {
                    this.authorizationStatusInfo = statusInfo
                    this.isGroupOrdersUser= statusInfo.isGroupOrdersUser()
                })
                .map(statusInfo => statusInfo.isGroupOrdersUser()),
            this.adminService.getLabo().map(labo => labo.data.maxOrderAmount).takeWhile(() => this.isPageRunning),    //takeWhile necessary on each starting observable path
            (products, isGroupOrderUser, maxOrderAmount) => {
                var totalHtva = products.map(item => item.annotation.totalPriceHTva).reduce((a, b) => a + b, 0)
                var nbLinesNonDisabled= products.filter(p => !p.data.disabled && !p.data.isFixCost).length
                return { 
                    total : products.map(item => item.annotation.totalPrice).reduce((a, b) => a + b, 0),
                    isTotalUnderLimit: totalHtva < maxOrderAmount,
                    isGroupOrderUser: isGroupOrderUser,
                    nbLinesNonDisabled: nbLinesNonDisabled
                }
            }
        )
        .do(infoObject => {
            this.isTotalUnderLimit= infoObject.isTotalUnderLimit
            this.nbLinesNonDisabled= infoObject.nbLinesNonDisabled
        })
        .filter(infoObject => !infoObject.isGroupOrderUser)
        .switchMap(infoObject => {
            return this.equipeService.getAnnotatedCurrentEquipe().filter(eq => eq).map(eq => infoObject.total < eq.annotation.amountAvailable).takeWhile(() => this.isPageRunning)  //takeWhile necessary on each switchmap 
        })
        .do(isEnoughBudget => {
            this.isEnoughBudget= isEnoughBudget
        })
        .takeWhile(() => this.isPageRunning)
        .subscribe(res => {
        })


        this.groupsForSelectionObservable = this.equipeService.getAnnotatedEquipesGroups().map(groups => groups.map(group => {
            return {
                id: group.data._id,
                name: group.data.name
            }
        }))

        this.equipeService.getAnnotatedEquipesGroups().takeWhile(() => this.isPageRunning).subscribe(groups => {
            this.groups = groups
        })


    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    public productsBasketObservable: Observable<any>;
    public selectedGroupId: string = undefined
    public productsInBasket: any[];
    public supplier;

    createOrder(): void {
        if (!this.isSubmitButtonFree) return
        this.isSubmitButtonFree= false
        var observable = this.basketService.createOrderFromBasket(this.productsInBasket, this.supplier._id, !this.selectedGroupId ? undefined : this.groups.filter(group => group.data._id === this.selectedGroupId)[0]);

        if (observable) { 
            observable.takeWhile(() => this.isPageRunning).subscribe(res => {
                var orderId = res._id;
                let link = ['/order', orderId];
                this.router.navigate(link);
            });
        }
    }

    equipeGroupChanged(newid) {
        this.selectedGroupId = newid
    }

}