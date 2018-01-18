import { Component, Input, Output, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from 'gg-basic-data-services'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { ProductService } from '../Shared/Services/product.service'
import { SelectableData } from '../Shared/Classes/selectable-data'
import { Observable, Subscription } from 'rxjs/Rx'
import { NgbTabChangeEvent, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'gg-product-fridge-order-button',
    templateUrl: './product-fridge-order-button.component.html'
})
export class ProductFridgeOrderButtonComponent implements OnInit {

    constructor(private dataStore: DataStore, private modalService: NgbModal, private authService: AuthService) {

    }

    @Input() productObservable;
    public product

    public subscriptionProduct: Subscription

    ngOnInit(): void {
        this.subscriptionProduct = this.productObservable.subscribe(p => {
            this.product = p
        })
    }

    ngOnDestroy(): void {
        this.subscriptionProduct.unsubscribe()
    }

    public saveFridgeOrder(formData) {
        if (+formData.qty < 1) return;

        var data = {
            equipeId: this.authService.getEquipeId(),
            userId: this.authService.getUserId(),
            productId: this.product.data._id,
            quantity: +formData.qty,
            isDelivered: false
        }

        this.dataStore.addData('orders.fridge', data).first().subscribe(res => {
            // todo msg: has been successfully saved
        }, );
    }


    openModal(template) {
        if (this.product.data.disabled) return
        var ref = this.modalService.open(template, { keyboard: false, backdrop: "static", size: "lg" });
        var promise = ref.result;
        promise.then((data) => {
            this.saveFridgeOrder(data);
        }, (res) => {
        });
        promise.catch((err) => {
        });
    }

}