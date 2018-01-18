import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'
import {AuthService} from './auth.service'
import { Observable, Subscription } from 'rxjs/Rx'


@Injectable()
export class UserService {
    readonly symOtp= 'otp'
    readonly symEquipe= 'equipe'
    readonly symOrder= 'order'
    readonly symTableDashlets= 'dashlets'

    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService) { }

    getCurrentUserObjectForComment() : Observable<any> 
    {
        return this.authService.getAnnotatedCurrentUser().map(user => {
            return {
                id: user.data._id,
                fullName: user.annotation.fullName
            }
        });
    }

    //   CRUD Changes
    //   =============

    private createDashletForCurrentUser(category: string, id: string)
    {
        let userId= this.authService.getUserId();

        this.dataStore.getDataObservable(this.symTableDashlets).first().subscribe(dashlets =>
        {
            if (dashlets.filter(dashlet => dashlet.user === userId && dashlet.category === category && dashlet.id === id).length === 0)
            {
                this.dataStore.addData(this.symTableDashlets, { userId: userId, category: category, id: id });
            }
        });        
    }    

    removeDashletForCurrentUser(dbid)
    {
        this.dataStore.getDataObservable(this.symTableDashlets).map(dashlets => dashlets.filter(dashlet => dashlet._id === dbid)).subscribe(dashlets =>
        {
            if (dashlets.length > 0)
            {
                let userId= this.authService.getUserId();
                let dashlet= dashlets[0];
                if (dashlet.userId===userId)
                {
                    this.dataStore.deleteData(this.symTableDashlets, dbid);
                }
            }
        });                
    }

    getDashletsForCurrentUser() : Observable<any>
    {
        return Observable.combineLatest(this.dataStore.getDataObservable(this.symTableDashlets), this.authService.getUserIdObservable(), (dashlets, userId) => {
            return dashlets.filter(dashlet => dashlet.userId === userId);
        });
    }

    // Otp specific
    // ============

    getOtpDashletsForCurrentUser() : Observable<any>
    {
        return this.getDashletsForCurrentUser().map(dashlets => dashlets.filter(dashlet => dashlet.category===this.symOtp))
    }

    createOtpDashletForCurrentUser(otpId: string)
    {
        return this.createDashletForCurrentUser(this.symOtp, otpId);
    }

    isOtpDashlet(category: string) : boolean
    {
        return category === this.symOtp;
    }

    // Equipe specific
    // ===============

    getEquipeDashletsForCurrentUser() : Observable<any>
    {
        return this.getDashletsForCurrentUser().map(dashlets => dashlets.filter(dashlet => dashlet.category===this.symEquipe))
    }

    createEquipeDashletForCurrentUser(equipeId: string)
    {
        return this.createDashletForCurrentUser(this.symEquipe, equipeId);
    }

    isEquipeDashlet(category: string) : boolean
    {
        return category === this.symEquipe;
    }
 
     // Order specific
    // ===============

    getOrderDashletsForCurrentUser() : Observable<any>
    {
        return this.getDashletsForCurrentUser().map(dashlets => dashlets.filter(dashlet => dashlet.category===this.symOrder))
    }

    createOrderDashletForCurrentUser(orderId: string)
    {
        return this.createDashletForCurrentUser(this.symOrder, orderId);
    }

    isOrderDashlet(category: string) : boolean
    {
        return category === this.symOrder;
    }
}