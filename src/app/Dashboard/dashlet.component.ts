import { Component, Input, OnInit } from '@angular/core'
import { UserService } from '../Shared/Services/user.service'
import { OrderService } from '../Shared/Services/order.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { OtpService } from '../Shared/Services/otp.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-dashlet',
        templateUrl: './dashlet.component.html'
    }
)
export class DashletComponent implements OnInit {
    constructor(private userService: UserService, private orderService: OrderService, private otpService: OtpService, private equipeService: EquipeService) {

    }

    @Input() category: string;
    @Input() id: string;

    ngOnInit(): void {
        if (this.isOtpDashlet()) {
            this.dataObservable = this.otpService.getAnnotatedOtpById(this.id);
        }

        if (this.isEquipeDashlet()) {
            this.dataObservable = this.equipeService.getAnnotatedEquipeById(this.id);
        }

        if (this.isOrderDashlet()) {
            this.dataObservable = this.orderService.getAnnotedOrder(this.id);
        }

        this.dataObservable.subscribe(x => {
            this.dataObject = x;
        });

    }

    public dataObservable: Observable<any>;
    public dataObject: any;

    public isOtpDashlet() {
        return this.userService.isOtpDashlet(this.category);
    }

    public isEquipeDashlet() {
        return this.userService.isEquipeDashlet(this.category);
    }

    public isOrderDashlet() {
        return this.userService.isOrderDashlet(this.category);
    }


    public getTitle(): string {
        if (this.isOtpDashlet()) return 'Otp: ' + this.dataObject.data.name;
        if (this.isEquipeDashlet()) return 'Equipe: ' + this.dataObject.data.name;
        if (this.isOrderDashlet()) return 'Order: ' + this.dataObject.data._id + ' (' + this.dataObject.annotation.supplier + ')';
    }

}