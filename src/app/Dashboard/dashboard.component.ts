import { Component, Input, OnInit } from '@angular/core'
import { UserService } from '../Shared/Services/user.service'
import { NotificationService } from '../Shared/Services/notification.service'
import { Observable } from 'rxjs/Rx'
import { AuthenticationStatusInfo, AuthService } from './../Shared/Services/auth.service'
import { NavigationService } from './../Shared/Services/navigation.service'
import { DataStore } from 'gg-basic-data-services'
import * as moment from "moment"

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-dashboard',
        templateUrl: './dashboard.component.html'
    }
)
export class DashboardComponent implements OnInit {
    privateMessages: any[];
    public authorizationStatusInfo: AuthenticationStatusInfo;

    public labManagerMessages: any
    initTabId = ''


    constructor(private dataStore: DataStore, private userService: UserService, private authService: AuthService, private notificationService: NotificationService, private navigationService: NavigationService) {

    }

    ngOnInit(): void {
        this.dashletsObservable = this.userService.getDashletsForCurrentUser();

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).do(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        }).switchMap(statusInfo => {
            return this.notificationService.getSortedUnreadPrivateMessages(statusInfo.currentUserId).takeWhile(() => this.isPageRunning)    
        }).subscribe(messages => {
            this.privateMessages= messages
        })

        this.notificationService.getLmWarningMessages().takeWhile(() => this.isPageRunning).subscribe(m => {
            this.labManagerMessages = m
        })
       
    }

    private isPageRunning: boolean = true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    public dashletsObservable: Observable<any>;

    navigateToOrder(id) {
        this.navigationService.maximizeOrUnmaximize('/order', id, 'dashboard', false)
    }

    navigateToOtp(id) {
        this.navigationService.maximizeOrUnmaximize('/otp', id, 'dashboard', false)
    }

    navigateToProduct(id) {
        this.navigationService.maximizeOrUnmaximize('/product', id, 'dashboard', false)
    }

    navigateToGeneric(objectType, id) {
        this.navigationService.maximizeOrUnmaximize('/' + objectType.trim(), id, 'dashboard', false)
    }
}