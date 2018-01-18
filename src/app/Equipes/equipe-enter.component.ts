import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from './../Shared/Services/data.service'
import { SelectableData } from '../Shared/Classes/selectable-data'
import { AuthService } from '../Shared/Services/auth.service'
import { Observable, Subscription } from 'rxjs/Rx'

@Component({
        //moduleId: module.id,
        selector: 'gg-equipe-enter',
        templateUrl: './equipe-enter.component.html'    
})
export class EquipeEnterComponent implements OnInit {
    public equipeForm: FormGroup;
    public selectableUsers: Observable<any>;
    public selectedUserIds;
    public selectableManagers: Observable<any>;
    public selectedManagerIds;

    constructor(private dataStore: DataStore, private formBuilder: FormBuilder, private authService: AuthService) {

    }
 
    @ViewChild('userSelector') usersChild;
    @ViewChild('mgrSelector') mgrsChild;
    

    ngOnInit():void {
        this.selectableUsers = this.authService.getSelectableUsers();
        this.selectableManagers = this.authService.getSelectableUsers();
        this.equipeForm = this.formBuilder.group({                      
            name: ['', [Validators.required, Validators.minLength(2)]],
            description: ['', Validators.required],
            nbOfMonthAheadAllowed: [''],
            isBlocked: ['']
        });
    }

    save(formValue, isValid)
    {
        this.dataStore.addData('equipes', {
            name: formValue.name,
            description: formValue.description,
            nbOfMonthAheadAllowed: formValue.nbOfMonthAheadAllowed,
            isBlocked: formValue.isBlocked!=='' && formValue.isBlocked!== null,
            userIds: this.selectedUserIds,
            managerIds: this.selectedManagerIds
        }).first().subscribe(res =>
        {
            var x=res;
            this.reset();
        });
    }

    reset()
    {
        this.equipeForm.reset();    
        this.usersChild.emptyContent()    
        this.mgrsChild.emptyContent()
    }

    userSelectionChanged(selectedUserIds: string[]) {        
        this.selectedUserIds = selectedUserIds;
    }

    managerSelectionChanged(selectedManagerIds: string[]) {        
        this.selectedManagerIds = selectedManagerIds;
    }

}

