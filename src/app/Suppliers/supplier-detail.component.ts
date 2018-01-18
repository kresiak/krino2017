import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { NgbModal, ModalDismissReasons, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from './../Shared/Services/product.service'
import { BasketService } from './../Shared/Services/basket.service'
import { VoucherService } from '../Shared/Services/voucher.service';
import { SupplierService } from './../Shared/Services/supplier.service'
import { AuthenticationStatusInfo, AuthService } from './../Shared/Services/auth.service'
import { OrderService } from './../Shared/Services/order.service'
import { DataStore } from './../Shared/Services/data.service'
import { ConfigService } from './../Shared/Services/config.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { NavigationService } from './../Shared/Services/navigation.service'
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-supplier-detail',
        templateUrl: './supplier-detail.component.html'
    }
)
export class SupplierDetailComponent implements OnInit {
    usersObservable: Observable<any>;
    eprocOrders: Observable<any>;
    fixCosts: any;
    constructor(private modalService: NgbModal, private formBuilder: FormBuilder, private dataStore: DataStore, private productService: ProductService, private orderService: OrderService,
        private router: Router, private authService: AuthService, private navigationService: NavigationService, private supplierService: SupplierService,
        private voucherService: VoucherService, private basketService: BasketService, private configService: ConfigService) {

    }

    @ViewChild('sapIdResultPopup') sapIdResultPopup;

    public useVoucherForm: FormGroup;
    public fixCostsForm: FormGroup;

    public supplierObservable: Observable<any>;
    @Input() supplierId: string
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false
    @Input() initialTab: string = 'tabProducts';
    @Output() stateChanged = new EventEmitter();

    public showAdminWebShoppingTab: boolean = true

    public stateInit() {
        if (this.initialTab === '') this.initialTab = 'tabProducts'
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = this.initialTab;

        this.showAdminWebShoppingTab = this.initialTab !== 'tabWebShopping'

        //if (!this.state.selectedWebShoppingTabId) this.state.selectedWebShoppingTabId = this.initialTab;        
    }

    public initForms() {
        const priceRegEx = `^\\d+(.\\d*)?$`;

        this.useVoucherForm = this.formBuilder.group({
            description: ['', [Validators.required, Validators.minLength(5)]],
            price: ['', [Validators.required, Validators.pattern(priceRegEx)]]
        });

        this.fixCostsForm = this.formBuilder.group({
            descriptionFixCosts: ['', [Validators.required]],
            priceFixCosts: ['', [Validators.required, Validators.pattern(priceRegEx)]]
        });
    }

    public isPageRunning: boolean = true

    ngOnInit(): void {
        this.stateInit()
        this.initForms()

        this.supplierObservable = this.supplierService.getAnnotatedSupplierById(this.supplierId)

        this.productsObservable = this.productService.getAnnotatedProductsBySupplier(this.supplierId);

        this.eprocOrders = this.orderService.getAnnotedEprocOrders()

        this.productService.getAnnotatedProductsBySupplier(this.supplierId).map(products => products.filter(p => p.data.isFixCost)).takeWhile(() => this.isPageRunning).subscribe(prods =>
            this.fixCosts = prods
        )

        this.productsBasketObservable = this.basketService.getAnnotatedProductsInCurrentUserBasketBySupplier(this.supplierId);
        this.productsBasketObservable.takeWhile(() => this.isPageRunning).subscribe(products => this.isThereABasket = products && products.length > 0);

        this.productsGroupedBasketObservable = this.basketService.getAnnotatedProductsInGroupOrdersUserBasketBySupplier(this.supplierId);
        this.productsGroupedBasketObservable.takeWhile(() => this.isPageRunning).subscribe(products => this.isThereAGroupedBasket = products && products.length > 0);

        this.ordersObservable = this.orderService.getAnnotedOrdersBySupplier(this.supplierId);

        this.usersObservable = this.orderService.getAnnotedUsersBySupplier(this.supplierId);

        this.orderService.hasSupplierAnyOrder(this.supplierId).takeWhile(() => this.isPageRunning).subscribe(anyOrder => this.anyOrder = anyOrder);
        this.authService.getAnnotatedCurrentUser().takeWhile(() => this.isPageRunning).subscribe(user => {
            this.currentAnnotatedUser = user
        })


        this.selectableCategoriesObservable = this.productService.getSelectableCategories();
        this.selectedCategoryIdsObservable = this.supplierObservable.map(supplier => supplier.data.webShopping && supplier.data.webShopping.categoryIds ? supplier.data.webShopping.categoryIds : []);

        this.supplierObservable.takeWhile(() => this.isPageRunning).subscribe(supplier => {
            if (!comparatorsUtils.softCopy(this.supplier, supplier))
                this.supplier = supplier;
        });

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public authorizationStatusInfo: AuthenticationStatusInfo;

    public productsObservable: Observable<any>;
    public productsBasketObservable: Observable<any>;
    public productsGroupedBasketObservable: Observable<any>;
    public ordersObservable: Observable<any>;
    public supplier: any;
    public isThereABasket: boolean = false;
    public isThereAGroupedBasket: boolean = false;
    public anyOrder: boolean;
    public selectableCategoriesObservable: Observable<any>;
    public selectedCategoryIdsObservable: Observable<any>;
    public currentAnnotatedUser: any;
    public deleted: boolean = false;

    gotoPreOrder() {
        let link = ['/preorder', this.supplierId];
        this.router.navigate(link);
    }

    public beforeTabChange($event: NgbTabChangeEvent) {
        if ($event.nextId === 'tabMax') {
            $event.preventDefault();
            this.navigationService.maximizeOrUnmaximize('/supplier', this.supplierId, this.path, this.isRoot)
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

    public beforeWebShoppingTabChange($event: NgbTabChangeEvent) {
        this.state.selectedWebShoppingTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };


    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    webShoppingUpdated(isEnabled) {
        if (!this.supplier.data.webShopping) this.supplier.data.webShopping = {}
        this.supplier.data.webShopping.isEnabled = isEnabled
        this.dataStore.updateData('suppliers', this.supplierId, this.supplier.data);
    }

    webShoppingEprocUpdated(isEnabled) {
        this.supplier.data.isEproc = isEnabled
        this.dataStore.updateData('suppliers', this.supplierId, this.supplier.data);
    }

    categorySelectionChanged(selectedIds: string[]) {
        if (!this.supplier.data.webShopping) this.supplier.data.webShopping = {}
        this.supplier.data.webShopping.categoryIds = selectedIds;
        this.dataStore.updateData('suppliers', this.supplierId, this.supplier.data);
    }

    categoryHasBeenAdded(newCategory: string) {
        this.productService.createCategory(newCategory);
    }

    nbVouchersOrdered(categoryId): number {
        return (this.supplier.annotation.voucherCategoryMap && this.supplier.annotation.voucherCategoryMap.has(categoryId)) ? this.supplier.annotation.voucherCategoryMap.get(categoryId).nbVouchersOrdered : 0
    }

    nbVouchersAvailable(categoryId): number {
        return (this.supplier.annotation.voucherCategoryMap && this.supplier.annotation.voucherCategoryMap.has(categoryId)) ? this.supplier.annotation.voucherCategoryMap.get(categoryId).vouchers.length : 0
    }

    nbVouchersOrderedUpdated(categoryId, nbOrdered) {
        if (!this.currentAnnotatedUser.data.voucherRequests) this.currentAnnotatedUser.data.voucherRequests = []
        let request = this.currentAnnotatedUser.data.voucherRequests.filter(request => request.supplierId === this.supplierId && request.categoryId === categoryId)[0]
        if (!request) {
            if (nbOrdered === 0) return
            request = {
                supplierId: this.supplierId,
                categoryId: categoryId
            }
            this.currentAnnotatedUser.data.voucherRequests.push(request)
        }
        if (nbOrdered === 0) {
            let index = this.currentAnnotatedUser.data.voucherRequests.findIndex(req => req === request)
            this.currentAnnotatedUser.data.voucherRequests.splice(index, 1)
        }
        request.quantity = nbOrdered
        this.dataStore.updateData('users.krino', this.currentAnnotatedUser.data._id, this.currentAnnotatedUser.data)
    }

    public voucherUseError: string = undefined
    public sapId: string = undefined

    save(formValue, isValid, supplierId, categoryId) {
        this.voucherUseError = undefined
        if (isValid) {
            this.voucherService.useVoucherForCurrentUser(supplierId, categoryId, formValue.price, formValue.description).subscribe(res => {
                if (res.error) {
                    this.voucherUseError = res.error
                }
                if (res.sapId) {
                    this.sapId = res.sapId
                    const modalRef = this.modalService.open(this.sapIdResultPopup, { keyboard: true, backdrop: false, size: "lg" });
                }
            })
        }
    }

    reset() {
        this.useVoucherForm.reset();
    }

    documentsChanged(newDocuments) {
        this.supplier.data.documents = newDocuments;
        this.dataStore.updateData('suppliers', this.supplier.data._id, this.supplier.data);        
    }


    costsPriceUpdated(costObject, price) {
        this.productService.getAnnotatedProductsById(costObject.data._id).first().subscribe(product => {
            if (!product || !product.data) return
            product.data.price = +price
            this.dataStore.updateData('products', product.data._id, product.data);
        })
    }

    costsDescriptionUpdated(costObject, description) {
        this.productService.getAnnotatedProductsById(costObject.data._id).first().subscribe(product => {
            if (!product || !product.data) return
            product.data.name = description
            this.dataStore.updateData('products', product.data._id, product.data);
        })
    }

    deleteFixCost(costObject) {
        this.productService.getAnnotatedProductsById(costObject.data._id).first().subscribe(product => {
            if (!product || !product.data) return
            product.data.disabled = true
            this.dataStore.updateData('products', product.data._id, product.data);
        })
    }

    resetFixCosts() {
        this.fixCostsForm.reset();
    }

    saveFixCosts(formValue, isValid) {
        if (!isValid) return
        if (!+formValue.priceFixCosts) return

        this.productService.createProduct({
            name: formValue.descriptionFixCosts,
            description: '',
            supplierId: this.supplierId,
            price: +formValue.priceFixCosts,
            package: '',
            categoryIds: [],
            catalogNr: '',
            noArticle: '300068',
            groupMarch: '613019',
            tva: 21,
            disabled: false,
            isFixCost: true
        }).subscribe(res => {
            this.resetFixCosts()
        });
    }


    public childUsersStateChanged($event) {
        this.state.Users = $event;
        this.stateChanged.next(this.state);
    }

}
