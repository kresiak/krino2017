import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { EquipeService } from '../Shared/Services/equipe.service'
import { OtpService } from '../Shared/Services/otp.service'
import { OtpChoiceService } from '../Shared/Services/otp-choice.service'
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component(
    {
        selector: 'gg-otp-checker',
        templateUrl: './otp-checker.component.html'
    }
)
export class OtpCheckerComponent implements OnInit {
    allEquipes: any[];
    isPageRunning: boolean = true;

    constructor(private equipeService: EquipeService, private authService: AuthService, private otpService: OtpService, private otpChoiceService: OtpChoiceService,
        private _sanitizer: DomSanitizer) {
    }

    @Output() spendingChanged = new EventEmitter();


    public equipeListObservable
    public authorizationStatusInfo: AuthenticationStatusInfo
    public classificationsList = []
    public selectableEquipes: any[];
    public equipeValue
    public currentEquipe

    public equipeId: string

    public isLoading:boolean= true

    ngOnInit(): void {
        this.isLoading= true
        this.equipeListObservable = this.equipeService.getEquipesForAutocomplete()

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning)
            .do(statusInfo => {
                this.authorizationStatusInfo = statusInfo
            })
            .switchMap(statusInfo => {
                return this.equipeService.getAnnotatedEquipes().takeWhile(() => this.isPageRunning)
            })
            .do(selectableEquipes => {
                this.allEquipes = selectableEquipes
                this.selectableEquipes = selectableEquipes.map(eq => { return { id: eq.data._id, value: eq.data.name } })
                this.equipeValue = this.selectableEquipes.filter(eq => eq.id === this.authorizationStatusInfo.currentEquipeId || !this.authorizationStatusInfo.hasEquipeId())[0]
            })
            .subscribe(selectableEquipes => {
                this.equipeId = this.equipeValue ? this.equipeValue.id : undefined
                this.currentEquipe = this.allEquipes.filter(eq => eq.data._id === this.equipeId)[0]
                
            })

        this.otpService.getAnnotatedClassifications().takeWhile(() => this.isPageRunning).subscribe(classification => {
            this.classificationsList = classification
            this.classificationsList.forEach(c => c.valueToSpend = 0)
        })
    }

    ngAfterViewInit() {
        this.isLoading= false
        //this.checkIfFormOk()
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    equipeChanged(equipe) {
        this.equipeId = equipe ? equipe.id : undefined
        this.currentEquipe = (this.allEquipes || []).filter(eq => eq.data._id === this.equipeId)[0]
        this.checkIfFormOk()
    }

    getFirstOtpCompatible(classificationsItem, equipeId): Observable<any> {
        var classificationId = classificationsItem.data._id
        return this.otpChoiceService.getCompatibleOtpsObservable(equipeId, this.authorizationStatusInfo.currentUserId, classificationsItem.valueToSpend || 1, classificationId).map(otps => otps.length > 0 ? otps[0] : undefined)
    }

    getFirstOtpCompatibleOrEmpty(classificationsItem, equipeId): Observable<any> {
        var classificationId = classificationsItem.data._id
        return this.otpChoiceService.getCompatibleOtpsObservable(equipeId, this.authorizationStatusInfo.currentUserId, classificationsItem.valueToSpend || 1, classificationId).map(otps => otps.length > 0 ? otps[0] :
            {
                data: {},
                annotation: {}
            }
        )
    }


    public checkIfFormOk() {
        if (this.isLoading) return
        if (this.isProblemInTotal || !this.totalToSpend) this.spendingChanged.emit(false)
        else if (this.totalToSpend !== this.classificationsList.filter(c => c.valueToSpend).map(c => c.valueToSpend).reduce((a, b) => a + b, 0)) this.spendingChanged.emit(false)
        else {
            if (this.classificationsList.filter(c => c.valueToSpend).length === 0) this.spendingChanged.emit(false)
            else {
                Observable.forkJoin(this.classificationsList.filter(c => c.valueToSpend).map(c => this.getFirstOtpCompatible(c, this.equipeId).first()))
                    .subscribe(arrRes => {
                        if (arrRes.filter(res => !res).length > 0) this.spendingChanged.emit(false)
                        else this.spendingChanged.emit({
                            totalSpent: this.totalToSpend,
                            equipeId: this.equipeId
                        })
                    })
            }
        }
    }

    changePrice(classificationsItem, data) {
        classificationsItem.valueToSpend = +data.target.value
        this.totalToSpend= this.classificationsList.filter(c => c.valueToSpend).map(c => c.valueToSpend).reduce((a, b) => a + b, 0)
        this.isProblemInTotal = this.totalToSpend > this.currentEquipe.annotation.amountAvailable
        this.checkIfFormOk()
    }

    public isProblemInTotal: boolean = false
    public totalToSpend: number = 0

    changeTotalToSpend(data) {
        this.totalToSpend = +data.target.value
        this.isProblemInTotal = this.totalToSpend > this.currentEquipe.annotation.amountAvailable
        this.checkIfFormOk()
    }

    autocompleListFormatter = (data: any): SafeHtml => {
        let html = `<span>${data.value}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    };

}