import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { AuthService } from '../Shared/Services/auth.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { FormItemStructure, FormItemType} from 'gg-ui'


@Component({
        selector: 'gg-equipe-enter',
        templateUrl: './equipe-enter.component.html'    
})
export class EquipeEnterComponent implements OnInit {
    public selectableUsers: Observable<any>;

    constructor(private dataStore: DataStore, private authService: AuthService) {

    }

    public formStructure: FormItemStructure[]= []
    
    ngOnInit():void {
        this.selectableUsers = this.authService.getSelectableUsers();

        this.formStructure.push(new FormItemStructure('name', 'EQUIPE.LABEL.NAME', FormItemType.InputText, {isRequired: true, minimalLength: 2, placeholderKey:'EQUIPE.LABEL.NAME PHOLDER'}))
        this.formStructure.push(new FormItemStructure('description', 'EQUIPE.LABEL.DESCRIPTION', FormItemType.InputText, {isRequired: true}))
        this.formStructure.push(new FormItemStructure('nbOfMonthAheadAllowed', 'EQUIPE.LABEL.MONTHS AHEAD ALLOWED', FormItemType.InputNumber, {minNumber: 0}))        
        this.formStructure.push(new FormItemStructure('isBlocked', 'EQUIPE.LABEL.IS BLOCKED', FormItemType.InputCheckbox))
        this.formStructure.push(new FormItemStructure('selectedUserIds', 'EQUIPE.LABEL.WITH FOLLOWING USERS', FormItemType.GigaSelector, {selectableData: this.selectableUsers}))        
        this.formStructure.push(new FormItemStructure('selectedManagerIds', 'EQUIPE.LABEL.HEADS OF EQUIPE', FormItemType.GigaSelector, {selectableData: this.selectableUsers}))        
    }

    formSaved(data)
    {
        var equipe: any= {}
        equipe.name= data.name
        equipe.description= data.description
        equipe.nbOfMonthAheadAllowed= data.nbOfMonthAheadAllowed
        equipe.isBlocked= data.isBlocked
        equipe.userIds= data.selectedUserIds
        equipe.managerIds= data.selectedManagerIds

        this.dataStore.addData('equipes', equipe).first().subscribe(res =>
        {
            data.setSuccess('OK')            
        });
    }

}

