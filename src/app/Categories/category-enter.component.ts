import { Component, Input, Output, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { Observable, Subscription } from 'rxjs/Rx'

@Component({
    //moduleId: module.id,
    selector: 'gg-category-enter',
    templateUrl: './category-enter.component.html'
})
export class CategoryEnterComponent implements OnInit {
    alreadyInDb: boolean= false;
    public categoryForm: FormGroup;

    constructor(private dataStore: DataStore, private formBuilder: FormBuilder) {

    }

    public isPageRunning: boolean = true

    public initCheck() {
        this.categoryForm.controls['name'].valueChanges.debounceTime(400).distinctUntilChanged().startWith('').takeWhile(() => this.isPageRunning)
            .switchMap(catName => {
                return this.dataStore.getDataObservable('categories').map(categories => categories.filter(c => c.name.toUpperCase().trim() === (catName || '').toUpperCase().trim())[0]).takeWhile(() => this.isPageRunning)
            })
            .subscribe(similarCategory => {
                this.alreadyInDb = similarCategory
            })
    }

    ngOnInit(): void {

        this.categoryForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(5)]],
            noArticle: ['', [Validators.required, Validators.minLength(5)]],
            groupMarch: ['', [Validators.required, Validators.minLength(5)]],
            isBlocked: [''],
            isOffice: ['']
        });

        this.initCheck()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    save(formValue, isValid) {
        this.dataStore.addData('categories', {
            name: formValue.name,
            noArticle: formValue.noArticle,
            groupMarch: formValue.groupMarch,
            isBlocked: formValue.isBlocked !== '' && formValue.isBlocked !== null,
            isOffice: formValue.isOffice !== '' && formValue.isOffice !== null
        }).first().subscribe(res => {
            var x = res;
            this.reset();
        });
    }

    reset() {
        this.categoryForm.reset();
        this.initCheck()     // For a mysterious reason, this has to be called after reset... valueChanges seem to be lost after reset   
    }

}

