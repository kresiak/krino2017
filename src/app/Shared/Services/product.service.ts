import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { SelectableData, SharedObservable } from 'gg-basic-code'
import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'
import * as moment from "moment"
import {utilsObservables as utils} from 'gg-basic-code'

@Injectable()
export class ProductService {

    private allProductsObservable: SharedObservable

    private initProductsObservable() {
        this.allProductsObservable = new SharedObservable(this.getAnnotatedProducts(this.dataStore.getDataObservable('products')).map(prods =>
            prods.sort((a, b) => {
                return b.annotation.productFrequence === a.annotation.productFrequence ? (a.data.name.replace('"', '').trim() < b.data.name.replace('"', '').trim() ? - 1 : 1) :
                    (b.annotation.productFrequence < a.annotation.productFrequence) ? -1 : 1
            }))
        )

        return this.allProductsObservable
    }


    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService) {
        //this.initProductDoubleObservable()

    }


    private productDoubleObservable: ConnectableObservable<any> = null

    private initProductDoubleObservable() {
        var toExclude = ['A COM', 'À COM', 'INCONNU', 'UNKNOWN', 'AUCUN', 'AUCUNE']

        this.productDoubleObservable = this.dataStore.getDataObservable('products')
            .map(products => products.filter(p => p.catalogNr && !p.disabled && !toExclude.includes(p.catalogNr.toUpperCase()) && p.catalogNr.length > 3).map(p => p.catalogNr).filter((elem, pos, arr) => arr.indexOf(elem) != pos))
            .map(catNumberList => new Set<string>(catNumberList))
            .publishReplay(1)
        this.productDoubleObservable.connect()
        return this.productDoubleObservable
    }

    getProductDoubleObservable(): Observable<any> {
        return this.productDoubleObservable || this.initProductDoubleObservable()     
    }




    // categories
    // ==========

    getSelectableCategories(): Observable<SelectableData[]> {
        return this.dataStore.getDataObservable('categories').map(categories => {
            return categories.sort((cat1, cat2) => { return cat1.name < cat2.name ? -1 : 1; }).map(category =>
                new SelectableData(category._id, category.name, category.isBlocked)
            )
        });
    }

    createCategory(newCategory): void {
        this.dataStore.addData('categories', { 'name': newCategory });
    }

    getAnnotatedCategories(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedProductsWithSupplierInfo(), this.dataStore.getDataObservable('categories'), this.dataStore.getDataObservable('otps'),
             this.dataStore.getDataObservable('otp.product.classifications'),
            (productsAnnotated: any[], categories, otps: any[], classifications: any[]) => {
                return categories.map(category => {
                    let suppliersInCategory = productsAnnotated.filter(product => product.data.categoryIds && product.data.categoryIds.includes(category._id)).map(product => product.annotation.supplierName)
                        .reduce((a: any[], b: string) => {   //take distincs
                            if (a.indexOf(b) < 0) a.push(b);
                            return a;
                        }, []).slice(0, 2);
                    let otpInCategory = otps.filter(otp => otp.categoryIds && otp.categoryIds.includes(category._id)).map(otp => otp.name)
                        .reduce((a: any[], b: string) => {   //take distincs
                            if (a.indexOf(b) < 0) a.push(b);
                            return a;
                        }, []).slice(0, 2);
                    let classificationsInCategory = classifications.filter(c => c.categoryIds && c.categoryIds.includes(category._id)).map(c => c.name)
                        .sort((a, b) => a < b ? -1 : 1)


                    return {
                        data: category,
                        annotation: {
                            supplierNames: suppliersInCategory,
                            otpNames: otpInCategory,
                            classificationsTxt: classificationsInCategory.reduce((a,b) => a + (a === '' ? '' : ', ') +  b, ''),
                            nbClassifications: classificationsInCategory.length
                        }
                    };
                }).sort((a, b) => a.data.name.toUpperCase() < b.data.name.toUpperCase() ? -1 : 1)
            });
    }

    getAnnotatedCategoriesById(id: string): Observable<any> {
        return this.getAnnotatedCategories().map(categories => categories.filter(s => {
            return s.data._id === id
        }

        )[0]);
    }

    getAnnotatedCategoriesWithNoClassifcation(): Observable<any> {
        return this.getAnnotatedCategories().map(categories => categories.filter(s => !s.annotation.nbClassifications));
    }


    // products
    // ========

    updateProduct(product): void {
        this.dataStore.updateData('products', product._id, product);
    }

    createProduct(product): Observable<any> {
        return this.dataStore.addData('products', product);
    }

    getProductsBySupplier(supplierId): Observable<any> {
        return this.dataStore.getDataObservable('products').map(produits => produits.filter(produit => produit.supplierId === supplierId));
    }

    getFixCostsBySupplier(supplierId): Observable<any> {
        return this.dataStore.getDataObservable('products').map(produits => produits.filter(produit => produit.supplierId === supplierId && produit.isFixCost && !produit.disabled));
    }


    getProductsByCategory(categoryId): Observable<any> {
        return this.dataStore.getDataObservable('products').map(produits => produits.filter(produit => produit.categoryIds.includes(categoryId)));
    }


    private getProductsBoughtByUser(userIdObservable: Observable<any>, ordersObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable('products'), ordersObservable, userIdObservable, (products: any[], orders: any[], userId: string) => {
            let distinctProductIdsByUser: any[] = orders.filter(order => order.userId === userId).reduce((acc: any[], order) => {
                let items: any[] = order.items || [];
                items.forEach(item => {
                    if (!acc.includes(item.productId)) {
                        acc.push(item.productId);
                    }
                });
                return acc;
            }, []);
            return products.filter(product => distinctProductIdsByUser.includes(product._id));
        });
    }


    setBasketInformationOnProducts(basketPorductsMap: Map<string, any>, products: any[]) {
        if (!basketPorductsMap || !products) return
        products.forEach(product => {
            product.annotation.hasBasket = basketPorductsMap.has(product.data._id)
            var basketItem = basketPorductsMap.get(product.data._id)
            product.annotation.basketId = product.annotation.hasBasket ? basketItem._id : null
            product.annotation.quantity = product.annotation.hasBasket ? basketItem.quantity : 0
        })
    }


    private getProductFrequenceMapObservable(): Observable<Map<string, number>> {    // parse the orders in a linear way to create a map product => nb orders    
        return this.dataStore.getDataObservable('orders').map(orders => orders.reduce((map, order) => {
            if (order.items) {
                order.items.filter(item => item.productId && item.quantity).forEach(item => {
                    let productId = item.productId
                    if (!map.has(productId)) map.set(productId, 0)
                    map.set(productId, map.get(productId) + 1)
                })
            }
            return map
        }, new Map()))
    }



    private getAnnotatedProducts(productsObservable: Observable<any>): Observable<any> {
        return Observable.combineLatest(productsObservable, this.dataStore.getDataObservable("suppliers"), this.authService.getAnnotatedUsers(),
            this.getProductFrequenceMapObservable(), this.authService.getUserIdObservable(), this.getProductDoubleObservable(), this.dataStore.getDataObservable('currencies'),
            this.dataStore.getDataObservable('products.stockage').map(entries => utils.hashMapToArrayFactoryHelper(entries, e => e.productId)),
            (products, suppliers, annotatedUsers, productFrequenceMap, currentUserId, setProductsInDouble, currencies, stockageEntriesMap) => {
                let mapSuppliers = suppliers.reduce((map, supplier) => {
                    map.set(supplier._id, supplier)
                    return map
                }, new Map());
                return products.map(product => {
                    if (!product.divisionFactor || !(+product.divisionFactor) || (+product.divisionFactor) < 0) product.divisionFactor = 1
                    let supplier = mapSuppliers.get(product.supplierId) //suppliers.filter(supplier => supplier._id === product.supplierId)[0];
                    let userWhoCreated= annotatedUsers.filter(user => user.data._id === product.creatingUserId)[0]
                    let currency= ! product.currencyId ? 'EUR' : (currencies.filter(c => c._id === product.currencyId)[0] || {'name': '???'}).name
                    return {
                        data: product,
                        annotation: {
                            hasStockage: stockageEntriesMap.has(product._id),
                            nbInStockage: !stockageEntriesMap.has(product._id) ? 0 : stockageEntriesMap.get(product._id).filter(e => !e.dateOut).length,
                            currency: currency,
                            userWhoCreated: userWhoCreated ? userWhoCreated.annotation.fullName : 'unknown user',
                            isPublic: !product.isLabo,
                            //basketId: basketItemFiltered && basketItemFiltered.length > 0 ? basketItemFiltered[0]._id : null,
                            hasCurrentUserPermissionToShop: !product.userIds || product.userIds.includes(currentUserId),
                            //quantity: basketItemFiltered && basketItemFiltered.length > 0 ? basketItemFiltered[0].quantity : 0,
                            supplierName: supplier ? supplier.name : "unknown",
                            disabled: product.disabled || (supplier && supplier.disabled),
                            productFrequence: productFrequenceMap.get(product._id) || 0,
                            multipleOccurences: setProductsInDouble.has(product.catalogNr),
                            priceUpdates: (product.priceUpdates || []).map(pu => {
                                let user= annotatedUsers.filter(user => user.data._id === pu.userId)[0]
                                return {
                                    data: pu,
                                    annotation: {
                                        user: user ?  user.annotation.fullName : 'unknown user'
                                    }
                                }
                            })
                        }
                    };
                });
            }
        );
    }



    getAnnotatedProductsAll(): Observable<any> {     // here and product list routable
        return (this.allProductsObservable || this.initProductsObservable()).getObservable()
/*        return this.getAnnotatedProducts(this.dataStore.getDataObservable('products')).map(prods =>
            prods.sort((a, b) => b.annotation.productFrequence - a.annotation.productFrequence));
*/    }

    getAnnotatedProductsById(id: string): Observable<any> {   // product detail routable
        return this.getAnnotatedProductsAll().map(products => products.filter(product => product.data._id === id)[0]);
    }

    getAnnotatedPrivateProducts(): Observable<any> { 
        return this.getAnnotatedProductsAll().map(products => products.filter(product => product.data.isLabo));
    }

    getAnnotatedProductsByCatalogNr(catalogNr: string): Observable<any> {  // for double products in   product detail and enter
        return this.getAnnotatedProductsAll().map(products => products.filter(product => product.data.catalogNr === catalogNr));
    }

    getAnnotatedProductsOnValidationWait(): Observable<any> {  // for double products in   product detail and enter
        return this.getAnnotatedProductsAll().map(products => products.filter(product => product.data.onCreateValidation));
    }

    getAnnotatedProductsBySupplier(supplierId): Observable<any> {   // supplier detai for main product grid
        return this.getAnnotatedProducts(this.getProductsBySupplier(supplierId)).map(prods => prods.sort((a, b) => b.annotation.productFrequence - a.annotation.productFrequence)).publishReplay(1).refCount();
    }

    getAnnotatedProductsByCategory(categoryId): Observable<any> {   // category detail
        return this.getAnnotatedProducts(this.getProductsByCategory(categoryId)).map(prods => prods.sort((a, b) => b.annotation.productFrequence - a.annotation.productFrequence));
    }

    getAnnotatedProductsBoughtByCurrentUser(): Observable<any> {    // mykrino: list of ordered products by me
        let productsObservable = this.getProductsBoughtByUser(this.authService.getUserIdObservable(), this.dataStore.getDataObservable('orders'));
        return this.getAnnotatedProducts(productsObservable).publishReplay(1).refCount();
    }


    getAnnotatedProductsWithSupplierInfo(): Observable<any> {
        return Observable.combineLatest(this.dataStore.getDataObservable("products"), this.dataStore.getDataObservable("suppliers"),
            (produits, suppliers) => {
                return produits.map(produit => {
                    let supplier = suppliers.filter(supplier => supplier._id === produit.supplierId)[0];
                    return {
                        data: produit,
                        annotation: {
                            supplierName: supplier ? supplier.name : "unknown"
                        }
                    };
                });
            }
        );
    }


    //=======================
    // filtering list helper


    getIsProductOKForListFn(self) {
        var categoriesMap: Map<string, any>
        var classificationMap: Map<string, any[]>
        this.dataStore.getDataObservable('categories').map(utils.hashMapFactory).first().subscribe(res => {
            categoriesMap= res
        })
        this.dataStore.getDataObservable('otp.product.classifications').first().subscribe(cs => {
            classificationMap= cs.reduce((map: Map<string, any[]>, c) => {
                (c.categoryIds || []).forEach(id => {                    
                    if (!map.has(id)) map.set(id, [])
                    map.get(id).push(c.name)
                })
                return map
            }, new Map<string, any[]>())
        })

        function testCategories(product, txt)  {
            if (! categoriesMap) return false
            var idList= (Array.isArray(product.data.categoryIds) ? product.data.categoryIds : [])
            return idList.map(id => categoriesMap.has(id) ? categoriesMap.get(id).name : '').filter(catName => catName.toUpperCase().includes(txt)).length > 0
        }

        function testClassifications(product, txt)  {
            if (! classificationMap) return false
            var idList= (Array.isArray(product.data.categoryIds) ? product.data.categoryIds : [])
            return idList.reduce((acc: any[], id) => {
                return acc.concat(classificationMap.get(id) || [])
            }, []).filter(catName => catName.toUpperCase().includes(txt)).length > 0
        }

        return function(product, txt) {
            if (txt === '' || txt === '!' || txt === '$' || txt === '$>' || txt === '$<') return !product.annotation.disabled

            if (txt.startsWith('$S/')) {
                let txt2 = txt.slice(3);
                return product.data.isStock && (!txt2 || product.data.name.toUpperCase().includes(txt2))
            }
            if (txt.startsWith('!')) {
                let txt2 = txt.slice(1);
                return !product.data.name.toUpperCase().includes(txt2) && !(product.annotation.supplierName || '').toUpperCase().includes(txt2)
            }
            if (txt.startsWith('$>') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return + product.data.price >= montant;
            }
            if (txt.startsWith('$<') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return + product.data.price <= montant;
            }
            if (txt.startsWith('#<') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return  product.annotation.hasStockage && +product.annotation.nbInStockage <= montant;
            }
            if (txt.startsWith('#>') && +txt.slice(2)) {
                let montant = +txt.slice(2);
                return  product.annotation.hasStockage && +product.annotation.nbInStockage > montant;
            }
            if (txt.startsWith('#HS')) {
                return product.annotation.hasStockage
            }
            if (txt.startsWith('$T') && (+txt.slice(2) + 1)) {
                let montant = +txt.slice(2);
                return + product.data.tva == montant;
            }

            if (txt.startsWith('$M')) {
                return !product.annotation.disabled && product.annotation.multipleOccurences;
            }

            if (txt.startsWith('$DO')) {
                return product.data.documents && product.data.documents.length > 0
            }

            if (txt.startsWith('$DI')) {
                return product.annotation.disabled;
            }

            if (txt.startsWith('$PR')) {
                return product.data.isLabo;
            }
            if (txt.startsWith('$PU')) {
                return !product.data.isLabo;
            }
            if (txt.startsWith('$OR')) {
                return product.annotation.productFrequence;
            }

            if (txt.startsWith('$FR')) {
                return product.data.isFrigo;
            }

            if (txt.startsWith('$V')) {
                return product.data.onCreateValidation;
            }
            if (self.isForSelection && txt.startsWith('$SE')) {
                return self.selectedProductIdsMap && self.selectedProductIdsMap.has(product.data._id);
            }

            return product.data.name.toUpperCase().includes(txt) || (product.data.description || '').toUpperCase().includes(txt) || (product.annotation.supplierName || '').toUpperCase().includes(txt) 
                || (product.data.package || '').toUpperCase().includes(txt) || product.data.catalogNr.toUpperCase().includes(txt)  || testCategories(product, txt) || testClassifications(product, txt)
        }
        
    }




    getSelectableCurrencies(): Observable<SelectableData[]> {
        return this.dataStore.getDataObservable('currencies').map(currencies => {
            return currencies.sort((cur1, cur2) => { return cur1.name < cur2.name ? -1 : 1; }).map(currency =>
                new SelectableData(currency._id, currency.name)
            )
        });
    }

    getCurrenciesForAutocomplete() {
        return this.dataStore.getDataObservable('currencies').map(currencies => currencies.map(currency => {
            return {
                id: currency._id,
                name: currency.name
            }
        }));
    }


    //=======================
    // adhoc


    flagStockProducts() {
        var oldIds = [263, 3148, 3150, 284, 4, 3152, 51, 1090, 3937, 97, 220, 3721, 2782, 2778, 1003, 1005, 1006, 3225, 2588, 3919, 3918, 3920, 3921, 2790, 84, 1194, 129, 3667, 497, 130, 3633, 3731, 3732, 3681, 3680, 105, 3783, 170, 2424, 3239, 3141, 3506, 3505, 3504, 3703, 116, 199, 203, 201, 3116, 3678, 3679, 1432, 95, 2739, 2743, 94, 2741, 100, 447, 81, 126, 151, 213, 238, 2393, 3675, 231, 20, 58, 185, 183, 180, 184, 3082, 227, 3085, 3323, 3735, 3344, 3346, 3347, 321, 3033, 3179, 3215, 2982, 3038, 2985, 3871, 93, 798, 92, 2760, 38]

        this.dataStore.getDataObservable('products').map(products => products.filter(product => oldIds.includes(product.oldId))).first().subscribe(products => {
            products.forEach(product => {
                product.isStock = true
                product.divisionFactor = 1
                this.dataStore.updateData('products', product._id, product)
            })
        })

    }

    // stockage
    // ==========

    getStockageEntriesMapObservableByScanId() {
        return Observable.combineLatest(this.dataStore.getDataObservable('products.stockage'),
            this.getAnnotatedProductsAll().map(products => utils.hashMapFactoryForAnnotated(products)),
            this.authService.getAnnotatedUsers().map(users => utils.hashMapFactoryForAnnotated(users)),
            (entries, productsMap, annotatedUsersMap) => {
                var list = entries.map(e => {
                    var product = productsMap.get(e.productId)
                    var userIn = annotatedUsersMap.get(e.userIdCreate)
                    var userOut = annotatedUsersMap.get(e.userIdOut)
                    return {
                        data: e,
                        annotation: {
                            userIn: !userIn ? 'unknown user' : userIn.annotation.fullName,
                            userOut: !userOut ? 'unknown user' : userOut.annotation.fullName,
                            isAlreadyOut: e.userIdOut || e.dateOut,
                            productName: !product ? 'unknown product' : product.data.name,
                            nbInStock:  !product ? 0 : product.annotation.nbInStockage
                        }
                    }
                })
                return utils.hashMapFactoryHelper(list, e => e.data.scanId)
            })        
    }

}
