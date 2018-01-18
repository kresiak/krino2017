import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from './../Shared/Services/data.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import {NotificationService} from '../Shared/Services/notification.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-communication-enter',
        templateUrl: './communication-enter.component.html'
    }
)

export class CommunicationEnterComponent implements OnInit {
    public communicationMessageForm: FormGroup;
    public messagesList;
    public currentUserId: string;
    public messageObject;
    public authorizationStatusInfo: AuthenticationStatusInfo
    public subscriptionAuthorization: Subscription
    public subscriptionUsers: Subscription
    public subscriptionMessages: Subscription

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private authService: AuthService, private notificationService: NotificationService ) {}

    ngOnInit(): void {
        this.communicationMessageForm = this.formBuilder.group({
            communicationMessage: ['', Validators.required]
        });

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
  
    save(formValue, isValid)
    {
        this.dataStore.addData('messages', {
            message: formValue.communicationMessage,
            userId: this.currentUserId
        }).subscribe(res =>
        {
            var x=res;
            this.reset();
        });
    };

    reset()
    {
        this.communicationMessageForm.reset();        
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
