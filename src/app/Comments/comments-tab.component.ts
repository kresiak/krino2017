import { Component, Input, Output, ViewEncapsulation, ViewChild, EventEmitter, OnInit } from '@angular/core';
import * as moment from "moment"
import { DataStore } from 'gg-basic-data-services'
import { NotificationService } from '../Shared/Services/notification.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component({
    selector: 'gg-comments-tab',
    templateUrl: './comments-tab.component.html'
})
export class CommentsTabComponent implements OnInit {
    privateMessages: any[];
    @Input() data;
    @Input() dbTable;
    @Input() urlPart;
    @Input() dontShowOldMessages: boolean= false 
    @Input() allowNotifyUsers: boolean = undefined  
    @Output() commentsUpdated = new EventEmitter() 


    constructor(private dataStore: DataStore, private authService: AuthService, private notificationService: NotificationService) {
    }
    
    public authorizationStatusInfo: AuthenticationStatusInfo

    ngOnInit(): void {
        if (this.allowNotifyUsers===undefined && this.urlPart) 
            this.allowNotifyUsers= true

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).do(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        }).switchMap(statusInfo => {
            return this.notificationService.getPrivateMessagesAboutObject(statusInfo.currentUserId, this.data._id).takeWhile(() => this.isPageRunning)    
        }).subscribe(messages => {
            this.privateMessages= messages
        })
    }

    private isPageRunning: boolean = true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    commentsHaveBeenUpdated(comments) {
        if (!this.authorizationStatusInfo || !this.authorizationStatusInfo.isLoggedIn) return
        if (this.data && comments) {
            this.data.comments = comments;
            this.dataStore.updateData(this.dbTable, this.data._id, this.data);
            this.commentsUpdated.next('')
        }
    }

    setMessagesAsRead() {
        if (!this.authorizationStatusInfo || !this.authorizationStatusInfo.isLoggedIn) return
        this.privateMessages.forEach(m => {
            m.isRead= true
            this.dataStore.updateData('messages', m._id, m)
        })
    }

    notifyUsers(userIds: any[]) {
        if (!this.authorizationStatusInfo || !this.authorizationStatusInfo.isLoggedIn) return
        if (!this.allowNotifyUsers) return
        userIds.forEach(id => this.notificationService.sendPrivateObjectMessage(id, this.urlPart, this.data._id, 'GENERAL.COMMENTS.ATTRACT ATTENTION TO OBJECT MSG'))
    }

}
