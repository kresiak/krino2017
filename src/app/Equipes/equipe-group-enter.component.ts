import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { AuthService } from '../Shared/Services/auth.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { Observable, Subscription } from 'rxjs/Rx'

@Component({
    //moduleId: module.id,
    selector: 'gg-equipe-group-enter',
    templateUrl: './equipe-group-enter.component.html'
})
export class EquipeGroupEnterComponent implements OnInit {
    public equipeForm: FormGroup;
    public selectableEquipes: Observable<any>;
    public selectedEquipeIds;

    constructor(private dataStore: DataStore, private formBuilder: FormBuilder, private authService: AuthService, private equipeService: EquipeService) {

    }

    @ViewChild('equipeSelector') equipesChild;

    ngOnInit(): void {
        this.selectableEquipes = this.equipeService.getSelectableEquipes();

        this.equipeForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(5)]],
            description: ['', Validators.required]
        });
    }

    save(formValue, isValid) {
        this.dataStore.addData('equipes.groups', {
            name: formValue.name,
            description: formValue.description,
            equipeIds: this.selectedEquipeIds.map(id => {
                return {
                    id: id,
                    weight: 1
                }
            })
        }).first().subscribe(res => {
            this.reset();
        });
    }

    reset() {
        this.equipeForm.reset();
        this.equipesChild.emptyContent()
    }

    equipeSelectionChanged(selectedEquipeIds: string[]) {
        this.selectedEquipeIds = selectedEquipeIds;
    }

}

