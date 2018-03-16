import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from 'gg-basic-data-services';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import {NotificationService} from '../Shared/Services/notification.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { FormItemStructure, FormItemType} from 'gg-ui'

@Component(
    {
        selector: 'gg-communication-enter',
        templateUrl: './communication-enter.component.html'
    }
)

export class CommunicationEnterComponent implements OnInit {
    public messagesList;
    public currentUserId: string;
    public messageObject;
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription
    public subscriptionUsers: Subscription
    public subscriptionMessages: Subscription

    public formStructure: FormItemStructure[]= [] 

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private authService: AuthService, private notificationService: NotificationService ) {}

    ngOnInit(): void {
        this.formStructure.push(new FormItemStructure('communicationMessage', 'MESSAGES', FormItemType.InputText, {isRequired: true, minimalLength: 2}))

        this.subscriptionUsers = this.authService.getUserIdObservable().subscribe(id => {
            this.currentUserId = id
        });

        this.subscriptionMessages = this.notificationService.getAnnotatedMessages().subscribe(messages => {
        this.messagesList = messages;
        });
    
        this.subscriptionAuthorization = this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });
    }
    
    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
         this.subscriptionUsers.unsubscribe()
         this.subscriptionMessages.unsubscribe()
    }
  
    formSaved(data)
    {
        this.dataStore.addData('messages', {
            message: data.communicationMessage,
            userId: this.currentUserId
        }).subscribe(res =>
        {
            data.setSuccess('OK')            
        });
    };

    messageUpdated(messageContent, messageObject) {
        messageObject.data.message = messageContent;
        this.dataStore.updateData('messages', messageObject.data._id, messageObject.data)
    };

    isDisabled(disabled:boolean, messageObject: any) {
        messageObject.data.isDisabled = disabled;
        this.dataStore.updateData('messages', messageObject.data._id, messageObject.data);
    };

};
