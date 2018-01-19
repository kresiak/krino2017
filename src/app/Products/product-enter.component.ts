import { Component, Input, Output, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { ProductService } from '../Shared/Services/product.service'
import { SelectableData } from 'gg-basic-code'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { Observable } from 'rxjs/Rx'
import * as utilsdate from './../Shared/Utils/dates'

@Component({
    //moduleId: module.id,
    selector: 'gg-product-enter',
    templateUrl: './product-enter.component.html'
})
export class ProductEnterComponent implements OnInit {
    public currencyData: SelectableData[]
    public productForm: FormGroup;

    constructor(private formBuilder: FormBuilder, private productService: ProductService, private authService: AuthService) {

    }

    @Input() supplierId: string
    @Input() productToClone: any= {data: {}, annotation: {}}

    public categoryData: SelectableData[]
    public categories
    public alreadyCatNrInDb: boolean= false
    public savingNewProduct: boolean= false
    public lastProductSaved: string= ''

    public authorizationStatusInfo: AuthenticationStatusInfo

    public isCategoryIdSelected(control: FormControl) {   // custom validator implementing ValidatorFn 
        if (control.value === '-1') {
            return { "category": true };
        }

        return null;
    }

    public isPageRunning: boolean = true

    ngOnInit(): void {
        this.productService.getSelectableCategories().takeWhile(() => this.isPageRunning).subscribe(cd => this.categoryData = cd.filter(c => !c.isBlocked));

        this.productService.getSelectableCurrencies().takeWhile(() => this.isPageRunning).subscribe(cu => this.currencyData = cu.filter(c => !c.isBlocked));

        this.productService.getAnnotatedCategories().takeWhile(() => this.isPageRunning).subscribe(categories => this.categories = categories)

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })


        const priceRegEx = `^\\d+(.\\d*)?$`;

        this.productForm = this.formBuilder.group({
            nameOfProduct: [this.productToClone.data.name || '', [Validators.required, Validators.minLength(5)]],
            description: [this.productToClone.data.description || ''],
            price: ['', [Validators.required, Validators.pattern(priceRegEx)]],
            package: [this.productToClone.data.package || '', Validators.required],
            category: ['-1', this.isCategoryIdSelected],
            currency: ['-1'],
            catalogNr: [this.productToClone.data.catalogNr || '', Validators.required],
            noarticle: [this.productToClone.data.noArticle || '', Validators.required],
            groupMarch: [this.productToClone.data.groupMarch || '', Validators.required],
            tva: [this.productToClone.data.tva || '', Validators.required],
            disabled: [''],
            isStock: [''],
            needsLotNumber: [''],
            divisionFactor: ['1'],
            stockPackage: ['']
        });

        this.productForm.controls['catalogNr'].valueChanges.debounceTime(400).distinctUntilChanged().startWith('').takeWhile(() => this.isPageRunning)
            .subscribe(catNr => {
            this.alreadyCatNrInDb=false
            if (catNr && catNr.length > 3) {   // Testing catNr because on KR computer it crashed with catNr === null - don't understand how it could happen
                this.productService.getAnnotatedProductsByCatalogNr(catNr).first().subscribe(prodList => {
                    this.alreadyCatNrInDb= prodList && prodList.length > 0
                })
            }
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    save(formValue, isValid) {
        if (!isValid) return
        if (!formValue.nameOfProduct) return
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
            currencyId: formValue.currency === '-1' ? undefined : formValue.currency,
            catalogNr: formValue.catalogNr,
            noArticle: formValue.noarticle,
            groupMarch: formValue.groupMarch,
            tva: formValue.tva,
            disabled: (!this.authorizationStatusInfo.isAdministrator() && !this.authorizationStatusInfo.isSuperAdministrator())  ||  
                                    (formValue.disabled !== '' && formValue.disabled !== null) ,
            onCreateValidation: (!this.authorizationStatusInfo.isAdministrator() && !this.authorizationStatusInfo.isSuperAdministrator()),
            needsLotNumber: formValue.needsLotNumber !== '' && formValue.needsLotNumber !== null,
            isStock: formValue.isStock !== '' && formValue.isStock !== null,
            isLabo: !this.authorizationStatusInfo.isSuperAdministrator(),
            divisionFactor: +formValue.divisionFactor,
            stockPackage: formValue.stockPackage,
            history: [
                {
                    date: utilsdate.nowFormated(),
                    userId: this.authorizationStatusInfo.getCurrentUserName(),
                    event: 'Product creation'
                }
            ],
        }).subscribe(res => {
            this.lastProductSaved= res.name
            var x = res;
            this.reset();
            this.savingNewProduct= false
        });
    }

    reset() {
        this.productForm.reset();
        this.productForm.controls['category'].setValue('-1');
        this.productForm.controls['currency'].setValue('-1');
    }

    categoryChanged(categoryId) {
        var category = this.categories.filter(c => c.data._id === categoryId)[0]
        this.productForm.patchValue({ noarticle: category ? category.data.noArticle : '', groupMarch: category ? category.data.groupMarch : '' })
    }
}