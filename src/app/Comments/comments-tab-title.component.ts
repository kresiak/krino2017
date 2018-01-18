import { Component, Input, Output, ViewEncapsulation, ViewChild, EventEmitter, OnInit } from '@angular/core';
import * as moment from "moment"
import { DataStore } from 'gg-basic-data-services'
import { NotificationService } from '../Shared/Services/notification.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component({
    selector: 'gg-comments-tab-title',
    templateUrl: './comments-tab-title.component.html'
})
export class CommentsTabTitleComponent implements OnInit {
    nbMessages: number;
    @Input() data: any;

    constructor(private dataStore: DataStore, private authService: AuthService, private notificationService: NotificationService) {
    }
    
    public authorizationStatusInfo: AuthenticationStatusInfo

    ngOnInit(): void {
        
        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).do(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        }).switchMap(statusInfo => {
            return this.notificationService.getNbPrivateMessagesAboutObject(statusInfo.currentUserId, this.data._id).takeWhile(() => this.isPageRunning)    
        }).subscribe(nbMessages => {
            this.nbMessages= nbMessages
        })
    }

    private isPageRunning: boolean = true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    getNbTotalMessagesText() {
        var nb= (this.data.comments || []).length
        return nb ? ('(' + nb + ')')  : ''
    }
}
