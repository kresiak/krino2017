import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx'
import { EquipeService } from '../Shared/Services/equipe.service';
import { OtpService } from '../Shared/Services/otp.service'
import { ProductService } from '../Shared/Services/product.service'
import { SapService } from './../Shared/Services/sap.service'
import { NavigationService } from '../Shared/Services/navigation.service'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { DataStore } from './../Shared/Services/data.service'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import * as comparatorsUtils from './../Shared/Utils/comparators'

@Component(
    {
        selector: 'gg-classifications',
        templateUrl: './classifications.component.html'
    }
)
export class ClassificationsComponent implements OnInit {
    categoryNoClassificationObservable: Observable<any>;
    constructor(private authService: AuthService, private otpService: OtpService, private dataStore: DataStore, private formBuilder: FormBuilder, private productService: ProductService) { }

    public isPageRunning: boolean = true
    public classificationForm: FormGroup
    public classificationsList = []
    
    ngOnInit(): void {
        this.categoryNoClassificationObservable= this.productService.getAnnotatedCategoriesWithNoClassifcation()

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        this.otpService.getAnnotatedClassifications().takeWhile(() => this.isPageRunning).subscribe(classification => {
            if (!comparatorsUtils.softCopy(this.classificationsList, classification))
                this.classificationsList= comparatorsUtils.clone(classification)            
        })

        this.classificationForm = this.formBuilder.group({
            classificationName: ['', [Validators.required, Validators.minLength(3)]],
            classificationDescription: ['']
        })
    }

    save(formValue, isValid) {
        this.dataStore.addData('otp.product.classifications', {
            name: formValue.classificationName,
            description: formValue.classificationDescription
        }).subscribe(res =>
        {
            this.reset()
        })
    }

    reset()
    {
        this.classificationForm.reset()
    }


    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public authorizationStatusInfo: AuthenticationStatusInfo;
}

