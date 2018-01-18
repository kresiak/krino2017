import { Component, OnInit, Input } from '@angular/core'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { DataStore } from 'gg-basic-data-services'
import { EquipeService } from '../Shared/Services/equipe.service';
import { Observable, Subscription } from 'rxjs/Rx'

@Component(
    {
        selector: 'gg-user-info',
        templateUrl: './user-info.component.html'
    }
)

export class UserInfoComponent implements OnInit {
    constructor(private dataStore: DataStore, private authService: AuthService, private equipeService: EquipeService) {}

    public selectableEquipes: Observable<any>;
    public selectedEquipeIdsObservable

    ngOnInit(): void {
        this.subscriptionAuthorization= this.authService.getStatusObservable().subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });

        this.selectableEquipes = this.equipeService.getSelectableEquipes();
        this.selectedEquipeIdsObservable= this.authService.getAnnotatedUserById(this.user.data._id).map(user => user.annotation.equipes.map(eq => eq._id))        
    }
    
    @Input() user; 

    ngOnDestroy(): void {
         this.subscriptionAuthorization.unsubscribe()
    }

    equipeSelectionChanged(selectedIds: string[]) {
        this.dataStore.reverseFKUpdate('equipes', 'userIds', selectedIds, this.user.data._id)
    }


    public subscriptionAuthorization: Subscription   
    public authorizationStatusInfo: AuthenticationStatusInfo
    //private subscriptionUser: Subscription         

    isAdminOrCurrentUser() {
        return this.authorizationStatusInfo && (this.authorizationStatusInfo.isAdministrator() || this.user.annotation.isCurrentUser)
    }

    emailUserUpdated(email) {
        this.user.data.email = email;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

    nameUserUpdated(name) {
        this.user.data.name = name;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

    firstNameUserUpdated(firstName) {
        this.user.data.firstName = firstName;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

    passwordUpdated(password) {
        this.user.data.password = password;
        this.dataStore.updateData('users.krino', this.user.data._id, this.user.data);
    };

  
}