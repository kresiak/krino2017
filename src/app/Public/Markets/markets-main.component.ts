import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { AuthAnoynmousService, SignedInStatusInfo } from './../../Shared/Services/auth-anonymous.service'
import { strictEqual } from 'assert';

@Component(
    {
        selector: 'gg-markets-main',
        templateUrl: './markets-main.component.html'
    }
)
export class MarketsMainComponent implements OnInit {
    authorizationStatusInfo: SignedInStatusInfo;
    productsObservable: Observable<any[]>;
    isPageRunning: boolean = true;
    public productsList: any[]

    constructor(private dataStore: DataStore, private authAnoynmousService: AuthAnoynmousService) {
    }

    fnFilterProduct(product, txt) {
        return product.data.name.toUpperCase().includes(txt.toUpperCase())
            || product.data.package.toUpperCase().includes(txt.toUpperCase())
            || (product.data.items || []).map(i => (i.supplier || '').toUpperCase()).filter(supplier => supplier.includes(txt.toUpperCase())).length > 0
            || (product.data.items || []).map(i => (i.catalogNr || '').toUpperCase()).filter(nr => nr.includes(txt.toUpperCase())).length > 0
    }


    public uploadUrl: string
    public filePath: string
    
    ngOnInit(): void {
        this.uploadUrl= this.dataStore.getUploadUrl()
        this.filePath= this.dataStore.getPictureUrlBase()

        this.productsObservable = Observable.combineLatest(this.dataStore.getDataObservable('products.market'), this.authAnoynmousService.getAnnotatedUsers(), (products, users) => {
            return products.map(product => {
                return {
                    data: product,
                    annotation: {
                        suppliersTxt: product.items.reduce((acc, i2) => acc + (acc ? ', ' : '') + i2.supplier, ''),
                        catNrTxt: product.items.reduce((acc, i2) => acc + ((acc && i2.catalogNr) ? ', ' : '') + i2.catalogNr, ''),
                        items: product.items.map(item => {
                            var theUser = users.filter(u => u.data._id === item.userId)[0]
                            return {
                                data: item,
                                annotation: {
                                    user: theUser ? theUser.annotation.fullName : 'unknown user'
                                }
                            }
                        })
                    }
                }
            })
        })

        this.authAnoynmousService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(res => {
            this.authorizationStatusInfo = res
        })
        //this.productsObservable = this.dataStore.getDataObservable('products.market') //.map(products => products.map())
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    supplierChanged(newValue, product, itemPos) {
        product.data.items[itemPos].supplier = newValue
        this.dataStore.updateData('products.market', product.data._id, product.data)
    }

    catalogNrChanged(newValue, product, itemPos) {
        product.data.items[itemPos].catalogNr = newValue
        this.dataStore.updateData('products.market', product.data._id, product.data)
    }

    priceChanged(newValue, product, itemPos) {
        product.data.items[itemPos].price = newValue
        this.dataStore.updateData('products.market', product.data._id, product.data)
    }

    justificationChanged(newValue, product, itemPos) {
        product.data.items[itemPos].justification = newValue
        this.dataStore.updateData('products.market', product.data._id, product.data)
    }

    imagesChanged(product, itemPos, newDocuments) {
        product.data.items[itemPos].documents = newDocuments
        this.dataStore.updateData('products.market', product.data._id, product.data).subscribe(res => {
            
        })
    }

    isUser(item): boolean {
        return this.authorizationStatusInfo && this.authorizationStatusInfo.currentUserId === item.data.userId
    }
}