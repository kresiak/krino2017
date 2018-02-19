import { Component, Input, Output, OnInit } from '@angular/core'
import { ProductService } from '../Shared/Services/product.service'
import { SelectableData } from 'gg-basic-code'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { Observable } from 'rxjs/Rx'
import {utilsDates as utilsdate} from 'gg-basic-code'
import { FormItemStructure, FormItemType} from 'gg-ui'


@Component({
    selector: 'gg-product-enter',
    templateUrl: './product-enter.component.html'
})
export class ProductEnterComponent implements OnInit {
    public currencySelectable: Observable<any>
    public categorySelectable: Observable<any>
    public catNrObservable: Observable<any>

    constructor(private productService: ProductService, private authService: AuthService) {

    }

    @Input() supplierId: string
    @Input() productToClone: any= {data: {}, annotation: {}}

    public formStructure: FormItemStructure[]= []

    public categoryData: SelectableData[]
    public categories
    public alreadyCatNrInDb: boolean= false
    public savingNewProduct: boolean= false
    public lastProductSaved: string= ''

    public authorizationStatusInfo: AuthenticationStatusInfo

    public isPageRunning: boolean = true

    ngOnInit(): void {
        this.categorySelectable= this.productService.getSelectableCategories().map(categories => categories.filter(c => !c.isBlocked))
        this.currencySelectable= this.productService.getSelectableCurrencies().map(currencies => currencies.filter(c => !c.isBlocked))
        this.catNrObservable= this.productService.getAnnotatedProductsAll().map(products => products.map(p => p.data.catalogNr))
        
        this.productService.getAnnotatedCategories().takeWhile(() => this.isPageRunning).subscribe(categories => this.categories = categories)

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })       

        this.currencySelectable.map(list => list.filter(d => d.name==='EUR')[0]).first().subscribe(res => {
            var euroId= res.id
            this.formStructure.push(new FormItemStructure('nameOfProduct', 'PRODUCT.LABEL.NAME OF PRODUCT', FormItemType.InputText, {isRequired: true, minimalLength: 5, value: this.productToClone.data.name || ''}))
            this.formStructure.push(new FormItemStructure('description', 'PRODUCT.LABEL.DESCRIPTION', FormItemType.InputText, {value: this.productToClone.data.description || ''}))
            this.formStructure.push(new FormItemStructure('price', 'PRODUCT.LABEL.PRICE', FormItemType.InputNumber, {isRequired: true, placeholderKey:'PRODUCT.LABEL.PRICE PER UNIT PHOLDER'}))
            this.formStructure.push(new FormItemStructure('currency', 'PRODUCT.LABEL.CURRENCY', FormItemType.GigaOptions, {selectableData: this.currencySelectable, value: this.productToClone.data.currencyId || euroId}))        
            this.formStructure.push(new FormItemStructure('package', 'PRODUCT.LABEL.PACKAGE', FormItemType.InputText, {isRequired: true, value: this.productToClone.data.package || ''}))
            this.formStructure.push(new FormItemStructure('category', 'PRODUCT.LABEL.CATEGORY', FormItemType.GigaOptions, {isRequired: true, selectableData: this.categorySelectable, 
                    value: (!this.productToClone.data.categoryIds || this.productToClone.data.categoryIds.length===0) ? undefined : this.productToClone.data.categoryIds[0]}))
            this.formStructure.push(new FormItemStructure('catalogNr', 'PRODUCT.LABEL.CATALOG NR', FormItemType.InputText, {isRequired: true, value: this.productToClone.data.catalogNr || ''}))
            this.formStructure.push(new FormItemStructure('noarticle', 'PRODUCT.LABEL.NO OF ARTICLE', FormItemType.InputText, {isRequired: true, value: this.productToClone.data.noArticle || ''}))
            this.formStructure.push(new FormItemStructure('groupMarch', 'PRODUCT.LABEL.GROUP MARCHANDISE', FormItemType.InputText, {isRequired: true, value: this.productToClone.data.groupMarch || ''}))
            this.formStructure.push(new FormItemStructure('tva', 'PRODUCT.LABEL.VAT', FormItemType.InputNumber, {isRequired: true, value: this.productToClone.data.tva || ''}))
            this.formStructure.push(new FormItemStructure('disabled', 'PRODUCT.LABEL.IS DISABLED', FormItemType.InputCheckbox))
            this.formStructure.push(new FormItemStructure('needsLotNumber', 'PRODUCT.LABEL.MAY ENCODING NUMBER', FormItemType.InputCheckbox, {tooltipKey: 'PRODUCT.LABEL.DEFINE HERE IF ENCODING TIP'}))
            this.formStructure.push(new FormItemStructure('isStock', 'PRODUCT.LABEL.MAY RESOLD STOCK', FormItemType.InputCheckbox, {tooltipKey: 'PRODUCT.LABEL.DEFINE HERE IF THIS PRODUCT TIP'}))
            this.formStructure.push(new FormItemStructure('divisionFactor', 'PRODUCT.LABEL.DIVISION FACTOR STOCK', FormItemType.InputNumber, {value: 1, tooltipKey: 'PRODUCT.LABEL.IF FOR EXAMPLE YOU BUY A BOX TIP'}))
            this.formStructure.push(new FormItemStructure('stockPackage', 'PRODUCT.LABEL.STOCK PACKAGING', FormItemType.InputText, {value: '', tooltipKey: 'PRODUCT.LABEL.ENTER HERE A TEXT TIP'}))    
        })

    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    formSaved(formValue) {
        if (!this.authorizationStatusInfo || !this.authorizationStatusInfo.isLoggedIn) return
        this.savingNewProduct= true
        this.lastProductSaved= ''
        this.productService.createProduct({
            creatingUserId: this.authorizationStatusInfo.currentUserId,
            name: formValue.nameOfProduct,
            description: formValue.description,
            supplierId: this.supplierId,
            price: formValue.price,
            package: formValue.package,
            categoryIds: [formValue.category],
            currencyId: formValue.currency,
            catalogNr: formValue.catalogNr,
            noArticle: formValue.noarticle,
            groupMarch: formValue.groupMarch,
            tva: formValue.tva,
            disabled: (!this.authorizationStatusInfo.isAdministrator() && !this.authorizationStatusInfo.isSuperAdministrator())  || formValue.disabled,
            onCreateValidation: (!this.authorizationStatusInfo.isAdministrator() && !this.authorizationStatusInfo.isSuperAdministrator()),
            needsLotNumber: formValue.needsLotNumber,
            isStock: formValue.isStock,
            isLabo: !this.authorizationStatusInfo.isSuperAdministrator(),
            divisionFactor: formValue.divisionFactor,
            stockPackage: formValue.stockPackage,
            history: [
                {
                    date: utilsdate.nowFormated(),
                    userId: this.authorizationStatusInfo.getCurrentUserName(),
                    event: 'Product creation'
                }
            ],
        }).subscribe(res => {
            formValue.setSuccess('OK')
            this.lastProductSaved= res.name
            this.savingNewProduct= false
        });
    }

    controlChanged(data) {
        if (data.name==='category') {
            var category = this.categories.filter(c => c.data._id === data.value)[0]
            if (category) {
                data.fnChangeControl('noarticle', category.data.noArticle)
                data.fnChangeControl('groupMarch', category.data.groupMarch)
            }
        }
    }

}