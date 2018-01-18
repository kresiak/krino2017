import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from './../Shared/Services/data.service'
import { SelectableData } from '../Shared/Classes/selectable-data'
import { AuthService } from '../Shared/Services/auth.service'
import { EquipeService } from '../Shared/Services/equipe.service';
import { Observable, Subscription } from 'rxjs/Rx'
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"

@Component({
    //moduleId: module.id,
    selector: 'gg-equipe-gift-enter',
    templateUrl: './equipe-gift-enter.component.html'
})
export class EquipeGiftEnterComponent implements OnInit {
    public giftForm: FormGroup;
    public equipesList: any[];
    public currentUserId: string


    constructor(private dataStore: DataStore, private formBuilder: FormBuilder, private authService: AuthService, private equipeService: EquipeService, private _sanitizer: DomSanitizer) {

    }

    @ViewChild('equipeSelector') equipesChild;

    ngOnInit(): void {

        this.authService.getUserIdObservable().subscribe(id => {
            this.currentUserId = id
        })

        this.equipeService.getEquipesForAutocomplete().subscribe(eq => {
            this.equipesList = eq
        });


        this.giftForm = this.formBuilder.group({
            equipeGivingId: ['', Validators.required],
            equipeTakingId: ['', Validators.required],
            amount: ['', Validators.required]
        });
    }

    save(formValue, isValid) {
        if (this.equipeGiving !== '' && this.equipeTaking !== '') {
            this.dataStore.addData('equipes.gifts', {
                equipeGivingId: this.equipeGiving.id,
                equipeTakingId: this.equipeTaking.id,
                amount: formValue.amount,
                userId: this.currentUserId
            }).first().subscribe(res => {
                this.reset();
            });
        }
    }

    reset() {
        this.giftForm.reset();
    }

    autocompleListFormatter = (data: any): SafeHtml => {
        let html = `<span>${data.name}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    };

    public equipeTaking: any
    equipeTakingChanged(x) {
        this.equipeTaking = x
    }

    public equipeGiving: any
    equipeGivingChanged(x) {
        this.equipeGiving = x
    }

}

