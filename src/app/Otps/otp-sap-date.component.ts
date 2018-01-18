import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { SapService } from './../Shared/Services/sap.service'
import * as moment from "moment"

@Component({
    selector: 'gg-sap-by-date',
    templateUrl: './otp-sap-date.component.html'
})
export class OtpSapByDateComponent implements OnInit {
    constructor(private sapService: SapService) { }

    @Input() otp: string;

    //private sapItemsSubscription: Subscription
    public sapItems
    public sapTtotals: any
    public intialdate = '01/01/2015'

    public dateSaved = new EventEmitter();

    ngOnInit(): void {
        this.dateSaved.subscribe(newDate => {
            this.sapService.getSapItemsObservableByOtpAndDate(this.otp, newDate).first().subscribe(res => {
                this.sapItems = res
                this.sapTtotals = this.sapItems.reduce((acc, item) => {
                    if (item.mainData.annotation.otpMap.has(this.otp)) {
                        let obj = item.mainData.annotation.otpMap.get(this.otp)
                        acc.mixedTvac += obj.totalTvac
                        acc.mixedHtva += obj.totalHtva
                    }
                    if (item.factured && item.factured.annotation.otpMap.has(this.otp)) {
                        let obj = item.factured.annotation.otpMap.get(this.otp)
                        acc.facturedTvac += obj.totalTvac
                        acc.facturedHtva += obj.totalHtva
                    }
                    if (item.engaged && item.engaged.annotation.otpMap.has(this.otp)) {
                        let obj = item.engaged.annotation.otpMap.get(this.otp)
                        acc.engagedTvac += obj.totalTvac
                        acc.engagedHtva += obj.totalHtva
                        if (!item.factured) {
                            acc.engagedOnlyTvac += obj.totalTvac
                            acc.engagedOnlyHtva += obj.totalHtva
                        }
                    }
                    return acc
                }, { engagedTvac: 0, engagedHtva: 0, engagedOnlyTvac: 0, engagedOnlyHtva: 0, facturedTvac: 0, facturedHtva: 0, mixedTvac: 0, mixedHtva: 0, })
            })
        })
        this.dateSaved.next(this.intialdate)
    }

    ngOnDestroy(): void {
        //this.sapItemsSubscription.unsubscribe()
    }

    dateChanged(newDate) {
        this.dateSaved.next(newDate)
    }
}