import { Component, OnInit } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { NotificationService } from './Shared/Services/notification.service';
import { ProductService } from './Shared/Services/product.service'
import { ApiService } from './Shared/Services/api.service';
import { SapService } from './Shared/Services/sap.service'


@Component(
    {
        //moduleId: module.id,
        templateUrl: './home.component.html'
    }
)
export class HomeComponent implements OnInit {
    public errFn = function (err) { console.log('Error: ' + err); }

    public receptionList: any;
    public messageList: any;


    constructor(private notificationService: NotificationService, private apiService: ApiService, private productService: ProductService, private sapService: SapService) {


    }

    ngOnInit(): void {


        this.notificationService.getAnnotatedReceptions().map(receptions => receptions.filter(reception => !reception.data.isProcessed)).subscribe(receptions => {
            this.receptionList = receptions ? receptions : [];
        });

        this.notificationService.getAnnotatedMessages().map(messages => messages.filter(message => !message.data.isDisabled)).subscribe(res => {
            this.messageList = res
        })


    }

    ngOnDestroy(): void {
    }

}