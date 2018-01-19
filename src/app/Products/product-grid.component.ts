import {Component, Input, OnInit, ViewChildren, QueryList} from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { ProductService } from './../Shared/Services/product.service';
import { BasketService } from './../Shared/Services/basket.service'
import { NavigationService } from './../Shared/Services/navigation.service'
import { SelectableData } from 'gg-basic-code'
import { Editor} from './../ui/editor/editor'
import { ActivatedRoute, Params, Router } from '@angular/router'
import * as utilsdate from './../Shared/Utils/dates'


@Component(
    {
        selector: 'gg-product-grid',
        templateUrl: './product-grid.component.html'
    }
)
export class ProductGridComponent implements OnInit
{
    @Input() productsObservable: Observable<any>;
    @Input() path: string = 'products'

    public products= [];

    constructor(private navigationService: NavigationService, private productService: ProductService, private authService: AuthService, private basketService: BasketService, private router: Router)
    {
    }

    public authorizationStatusInfo: AuthenticationStatusInfo;
    public selectableCategoriesObservable: Observable<any>;
    
    @ViewChildren(Editor) priceChildren : QueryList<Editor>;

    public basketPorductsMap: Map<string, any> = new Map<string, any>()

    getFilterFn() {
        var self = this
        return this.productService.getIsProductOKForListFn(self)
    }

    setProducts(products) {
        this.products = products
        if (this.basketPorductsMap)
            this.productService.setBasketInformationOnProducts(this.basketPorductsMap, this.products)
    }


    ngOnInit() : void{
        this.selectableCategoriesObservable = this.productService.getSelectableCategories();

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });        

        this.basketService.getBasketProductsSetForCurrentUser().takeWhile(() => this.isPageRunning).subscribe(basketPorductsMap =>  {
            this.basketPorductsMap= basketPorductsMap
            this.productService.setBasketInformationOnProducts(this.basketPorductsMap, this.products)
        })
    }

    public isPageRunning: boolean = true
    ngOnDestroy(): void {
        this.isPageRunning= false
    }

    public logHistory(product, event: string, oldValue, newValue) {
        if (!product.data.history) product.data.history = []
        product.data.history.push({
            date: utilsdate.nowFormated(),
            userId: this.authorizationStatusInfo.getCurrentUserName(),
            event: event,
            oldValue: oldValue,
            newValue: newValue
        })
    }


    getProductObservable(id: string) : Observable<any>
    {
        return this.productsObservable.map(products => products.filter(product => product.data._id === id)[0]);
    }


    getProductCategoryIdsObservable(id: string) : Observable<any>
    {
        return this.productsObservable.map(products => products.filter(product => product.data._id === id)[0].data.categoryIds);
    }

    descriptionUpdated(desc: string, product) {
        if (product.data.name !== desc) {
            this.logHistory(product, 'name change', product.data.name, desc)
            product.data.name = desc;
            this.productService.updateProduct(product.data);
        }
    }

    prixUpdated(prix: string, product) {
        var p: number = +prix && (+prix) >= 0 ? +prix : -1;
        if (p !== -1) {
            if (product.price !== p) {
                if (!product.data.priceUpdates) product.data.priceUpdates = []
                product.data.priceUpdates.unshift({ date: utilsdate.nowFormated(), newPrice: +p, oldPrice: +product.data.price, userId: this.authorizationStatusInfo.currentUserId })
                
                product.data.price = p;
                this.productService.updateProduct(product.data);
            }
        }
        else {
            var ctrl= this.priceChildren.toArray().filter(editorControl => editorControl.id === product.data._id)[0]
            if (ctrl)                
                ctrl.resetContent(product.data.price);
        }
    }

    categorySelectionChanged(selectedIds: string[], product) {
        this.logHistory(product, 'category change', product.data.categoryIds, selectedIds)
        product.data.categoryIds = selectedIds;
        this.productService.updateProduct(product.data);
    }

    categoryHasBeenAdded(newCategory: string) {
        this.productService.createCategory(newCategory);
    }

    quantityBasketUpdated(quantity: string, product) {
        this.basketService.doBasketUpdate(product, quantity)
    }

    navigateToProduct(product) {
        this.navigationService.maximizeOrUnmaximize('/product', product.data._id, this.path, false)
    }

}