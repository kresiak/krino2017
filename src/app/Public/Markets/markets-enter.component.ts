import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { AuthAnoynmousService } from './../../Shared/Services/auth-anonymous.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import {utilsDates as utilsdate} from 'gg-basic-code'

@Component(
    {
        selector: 'gg-enter-market-product',
        templateUrl: './markets-enter.component.html'
    }
)
export class MarketsEnterComponent implements OnInit {
    isPageRunning: boolean = true;
    public marketsEnterForm: FormGroup

    @ViewChild('uploader') imageUploadComponent;

    constructor(private dataStore: DataStore, private formBuilder: FormBuilder, private authAnoynmousService: AuthAnoynmousService) {
    }

    ngOnInit(): void {

        this.marketsEnterForm = this.formBuilder.group({
            nameOfProduct: ['', [Validators.required, Validators.minLength(2)]],
            package: ['', [Validators.required, Validators.minLength(2)]],
            supplier: ['', [Validators.required, Validators.minLength(2)]],
            catalogNr: [''],
            price: ['', [Validators.required]],
            justification: ['']
        });
    }

    save(formValue, isValid, resteAll: boolean) {
        this.dataStore.getDataObservable('products.market').first().map(products => products.filter(p => p.name.toUpperCase().trim() === formValue.nameOfProduct.toUpperCase().trim() && p.package.toUpperCase().trim() === formValue.package.toUpperCase().trim()))
            .switchMap(products => {
                var createItem = () => {
                    return {
                        date: utilsdate.nowFormated(),
                        userId: this.authAnoynmousService.getUserId(),
                        supplier: formValue.supplier,
                        catalogNr: formValue.catalogNr,
                        price: formValue.price,
                        justification: formValue.justification,
                        documents: this.fileDocuments
                    }
                }

                if (products.length > 0) {
                    var theProduct = products[0]
                    if (!theProduct.items) theProduct.items = []
                    theProduct.items.push(createItem())
                    return this.dataStore.updateData('products.market', theProduct._id, theProduct)
                }
                else {
                    var newProduct = {
                        name: formValue.nameOfProduct,
                        package: formValue.package,
                        items: [createItem()]
                    }
                    return this.dataStore.addData('products.market', newProduct)
                }
            }).subscribe(res => {
                this.resetMarketsEnterForm(resteAll);
            })
    }

    public fileDocuments: any[] = []

    resetMarketsEnterForm(resetAll: boolean) {
        if (resetAll) this.marketsEnterForm.controls['nameOfProduct'].setValue('')
        if (resetAll) this.marketsEnterForm.controls['package'].setValue('')
        this.marketsEnterForm.controls['supplier'].setValue('')
        this.marketsEnterForm.controls['catalogNr'].setValue('')
        this.marketsEnterForm.controls['price'].setValue('')
        this.marketsEnterForm.controls['justification'].setValue('')
        this.fileDocuments = []
        this.imageUploadComponent.clearPictures()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    onUploadFinished(documents) {
        this.fileDocuments= documents
    }
}