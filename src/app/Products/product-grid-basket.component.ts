import { Component, Input, OnInit, ViewChildren, QueryList } from '@angular/core';
import { Observable } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { ProductService } from './../Shared/Services/product.service';
import { BasketService } from './../Shared/Services/basket.service'
import { NavigationService } from './../Shared/Services/navigation.service'
import { SelectableData } from 'gg-basic-code'
import { Editor } from 'gg-ui'
import { DataStore } from 'gg-basic-data-services'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component(
    {
        selector: 'gg-product-grid-basket',
        templateUrl: './product-grid-basket.component.html'
    }
)
export class ProductGridBasketComponent implements OnInit {
    otpListObservable: Observable<{ id: any; name: any; }[]>;
    authorizationStatusInfo: AuthenticationStatusInfo;
    @Input() productsObservable: Observable<any>;
    @Input() config;
    @Input() isGroupedBasket: boolean = false;
    @Input() path: string = 'productsBasket'

    public products;
    public total: number= 0

    constructor(private dataStore: DataStore, private navigationService: NavigationService, private productService: ProductService, private authService: AuthService,
        private basketService: BasketService, private router: Router, private modalService: NgbModal) {
    }

    @ViewChildren(Editor) priceChildren: QueryList<Editor>;

    getFilterFn() {
        var self = this
        return this.productService.getIsProductOKForListFn(self)
    }

    calculateTotal(products): number {
        return products.filter(product => !product.data.disabled).reduce((acc, product) => acc + (+product.annotation.totalPrice || 0), 0)
    }

    ngOnInit(): void {
        this.otpListObservable = this.dataStore.getDataObservable('otps').map(otps => otps.map(otp => {
            return {
                id: otp._id,
                name: otp.name
            }
        }));

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    }

    private isPageRunning: boolean = true
    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    public classificationIdForModalW
    public amountForModalW
    public equipeIdForModalW
    public productForModalW

    openModal(template, product) {
        this.equipeIdForModalW= this.authorizationStatusInfo.currentEquipeId
        this.amountForModalW= product.annotation.totalPrice
        this.classificationIdForModalW= product.annotation.classificationId
        this.productForModalW= product

        var ref = this.modalService.open(template, { keyboard: false, backdrop: "static", size: "lg" });
        var promise = ref.result;
        promise.then((data) => {
        }, (res) => {
        });
        promise.catch((err) => {
        });
    }




    setProducts(products) {
        this.products = products
        this.total= this.calculateTotal(products)
    }

    getProductObservable(id: string): Observable<any> {
        return this.productsObservable.map(products => products.filter(product => product.data._id === id)[0]);
    }


    showColumn(columnName: string) {
        return !this.config || !this.config['skip'] || !(this.config['skip'] instanceof Array) || !this.config['skip'].includes(columnName);
    }

    getProductCategoryIdsObservable(id: string): Observable<any> {
        return this.productsObservable.map(products => products.filter(product => product.data._id === id)[0].data.categoryIds);
    }

    descriptionUpdated(desc: string, product) {
        if (product.data.name !== desc) {
            product.data.name = desc;
            this.productService.updateProduct(product.data);
        }
    }

    prixUpdated(prix: string, product) {
        var p: number = +prix && (+prix) >= 0 ? +prix : -1;
        if (p !== -1) {
            if (product.price !== p) {
                product.data.price = p;
                this.productService.updateProduct(product.data);
            }
        }
        else {
            var ctrl = this.priceChildren.toArray().filter(editorControl => editorControl.id === product.data._id)[0]
            if (ctrl)
                ctrl.resetContent(product.data.price);
        }
    }

    quantityBasketUpdated(quantity: string, product) {
        this.basketService.doBasketUpdate(product, quantity)
    }

    quantityGroupedBasketUpdated(quantity: string, product, itemPos: number) {
        if (!+quantity) return
        product.annotation.basketData.items[itemPos].quantity= +quantity
        //item.data.quantity = +quantity
        product.annotation.basketData.quantity = (product.annotation.basketData.items || []).reduce((acc, item) => acc + item.quantity, 0)
        this.dataStore.updateData('basket', product.annotation.basketId, product.annotation.basketData)
    }

    navigateToProduct(product) {
        this.navigationService.maximizeOrUnmaximize('/product', product.data._id, this.path, false)
    }

    otpUpdated(newOtpId, product): void {
        if (newOtpId && newOtpId.length > 0) {
            this.basketService.doBasketOtpUpdate(product, newOtpId)
            //product.annotation.otp._id= newOtpId
        }
    }

    setNotUrgent(product): void {
        this.basketService.doBasketNotUrgent(product).first().subscribe(res => {

        })
    }
}