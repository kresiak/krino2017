import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DataStore } from 'gg-basic-data-services';
import { NotificationService } from './../Shared/Services/notification.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component(
    {
        selector: 'gg-user-enter',
        templateUrl: './user-enter.component.html'
    }
)

export class UserEnterComponent implements OnInit {
    
    public newUserForm: FormGroup;    

    constructor(private formBuilder: FormBuilder, private dataStore: DataStore, private notificationService: NotificationService ) {}

    ngOnInit(): void {
        // todo: ne marche pas encore
        //  const emailRegex = '^[a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,15})$';

            const emailRegex = /^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}\s*$/i;

        this.newUserForm = this.formBuilder.group({                      
            name: ['', [Validators.required, Validators.minLength(3)]],
            firstName: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],
            isBlocked: [''],
            isLaboUser: [''],
            isAdmin: [''],
            password: [''],
            isReceptionist: [''],
            isLabManager: [''],
            isProgrammer: [''],
            isPassiveUser: ['']
        });
    };
    
    save(formValue, isValid)
    {
        this.dataStore.addData('users.krino', {
            name: formValue.name,
            firstName: formValue.firstName,
            email: formValue.email.trim(),
            isBlocked: formValue.isBlocked!=='' && formValue.isBlocked!==null,
            isLaboUser: formValue.isLaboUser!=='' && formValue.isLaboUser!==null,
            isAdmin: formValue.isAdmin!=='' && formValue.isAdmin!==null,
            password: formValue.password,
            isReceptionist: formValue.isReceptionist!=='' && formValue.isReceptionist!==null,
            isLabManager: formValue.isLabManager!=='' && formValue.isLabManager!==null,
            isProgrammer: formValue.isProgrammer!=='' && formValue.isProgrammer!==null,
            isPassiveUser: formValue.isPassiveUser!=='' && formValue.isPassiveUser!==null
        }).first().subscribe(res =>
        {
            var x=res;
            this.reset();
            this.notificationService.mailTo(formValue.email.trim(), 'A Krino account has been created for you', '<p>Your password is ' + formValue.password + '</p><p>You can find Krino on http://139.165.57.34/krino/home or <a href="http://139.165.57.34/krino/home">Click here</a></p>' )
        });
    }

    reset()
    {
        this.newUserForm.reset();    
    }


}
