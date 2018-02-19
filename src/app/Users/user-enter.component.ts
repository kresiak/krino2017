import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from 'gg-basic-data-services';
import { NotificationService } from './../Shared/Services/notification.service';
import { FormItemStructure, FormItemType} from 'gg-ui'


@Component(
    {
        selector: 'gg-user-enter',
        templateUrl: './user-enter.component.html'
    }
)

export class UserEnterComponent implements OnInit {
    
    public formStructure: FormItemStructure[]= []
    
    constructor(private dataStore: DataStore, private notificationService: NotificationService ) {}

    ngOnInit(): void {
        this.formStructure.push(new FormItemStructure('name', 'USER.LABEL.NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2, placeholderKey:'USER.LABEL.NAME OF THE USER PHOLDER'}))
        this.formStructure.push(new FormItemStructure('firstName', 'USER.LABEL.FIRST NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2, placeholderKey:'USER.LABEL.FIRST NAME OF THE USER PHOLDER'}))
        this.formStructure.push(new FormItemStructure('email', 'USER.LABEL.EMAIL', FormItemType.InputText, {isRequired: true, isEmail:true}))
        this.formStructure.push(new FormItemStructure('password', 'USER.LABEL.PASSWORD', FormItemType.InputText, {isRequired: true, minimalLength: 2}))
        
        this.formStructure.push(new FormItemStructure('isBlocked', 'USER.LABEL.IS BLOCKED', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isLaboUser', 'USER.LABEL.IS LABO USER', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isAdmin', 'USER.LABEL.IS ADMINISTRATOR', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isReceptionist', 'USER.LABEL.IS RECEPTIONIST', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isLabManager', 'USER.LABEL.IS LAB MANAGER', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isProgrammer', 'USER.LABEL.IS KRINO PROGRAMMER', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('isPassiveUser', 'USER.LABEL.USER IS NOT ALLOWED TO ORDER PRODUCTS', FormItemType.InputCheckbox))
    };
    
    formSaved(data)
    {
        this.dataStore.addData('users.krino', {
            name: data.name,
            firstName: data.firstName,
            email: data.email,
            isBlocked: data.isBlocked,
            isLaboUser: data.isLaboUser,
            isAdmin: data.isAdmin,
            password: data.password,
            isReceptionist: data.isReceptionist,
            isLabManager: data.isLabManager,
            isProgrammer: data.isProgrammer,
            isPassiveUser: data.isPassiveUser
        }).first().subscribe(res =>
        {
            data.setSuccess('OK')
            this.notificationService.mailTo(data.email.trim(), 'A Krino account has been created for you', '<p>Your password is ' + data.password + '</p><p>You can find Krino on http://139.165.57.34/krino/home or <a href="http://139.165.57.34/krino/home">Click here</a></p>' )
        });
    }


}
