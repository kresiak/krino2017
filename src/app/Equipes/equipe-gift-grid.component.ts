import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { DataStore } from './../Shared/Services/data.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { OrderService } from '../Shared/Services/order.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component({
    selector: 'gg-equipe-gift-grid',
    templateUrl: './equipe-gift-grid.component.html'
})
export class EquipeGiftGridComponent implements OnInit {


    constructor(private dataStore: DataStore, private authService: AuthService, private orderService: OrderService) {

    }

    @Input() equipeGiftsObservable: Observable<any>

    public equipeGifts;
    public isFormOk: boolean = true;
    subscriptionEquipeGifts: Subscription
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription

    ngOnInit(): void {
        this.subscriptionEquipeGifts= this.equipeGiftsObservable.subscribe(res => {
            this.equipeGifts = res
        })

        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    };

    ngOnDestroy(): void {
         this.subscriptionEquipeGifts.unsubscribe()
         this.subscriptionAuthorization.unsubscribe()
    }

    updateAmount(amount, gift){
        if(+amount || amount === '0'){
            var amountNr = +amount;
            this.isFormOk = true;
            gift.data.amount = amountNr;
            if (amountNr === 0) {
                this.dataStore.deleteData('equipes.gifts', gift.data._id)
            }
            else {
                this.dataStore.updateData('equipes.gifts', gift.data._id, gift.data);
            }            
        }
        else{
            this.isFormOk = false;
        }            
    };
    
};