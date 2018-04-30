import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx'
import { OtpService } from '../Shared/Services/otp.service'
import { SapService } from './../Shared/Services/sap.service'
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import {utilsComparators as comparatorsUtils} from 'gg-search-handle-data'
import {utilsDates as dateUtils, utilsReports as reportsUtils} from 'gg-basic-code'
import { TranslationLoaderService } from 'gg-translation'

@Component(
    {
        //moduleId: module.id,
        selector: 'gg-otp-list',
        templateUrl: './otp-list.component.html'
    }
)
export class OtpListComponent implements OnInit {

    @Input() otpsObservable: Observable<any>;
    @Input() config;
    @Input() state;
    @Input() path: string = 'otps'
    @Output() stateChanged = new EventEmitter();

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.openPanelId) this.state.openPanelId = '';
    }

    public otps;
    otpSapMap: Map<string, any>;

    constructor(private sapService: SapService, private otpService: OtpService, private translationLoaderService: TranslationLoaderService) {
    }

    filterOtps(otp, txt) {
        if (txt === '' || txt === '#') return !otp.data.isDeleted

        if (txt.startsWith('#LI')) {
            return otp.data.isLimitedToOwner && !otp.data.isDeleted
        }
        if (txt.startsWith('#LU')) {
            return otp.data.userIds && otp.data.userIds.length > 0
        }
        if (txt.startsWith('#DE')) {
            return otp.data.isDeleted
        }
        if (txt.startsWith('#BL')) {
            return otp.data.isBlocked && !otp.data.isDeleted
        }
        if (txt.startsWith('#CL')) {
            return otp.data.isClosed && !otp.data.isDeleted
        }
        if (txt.startsWith('#P0')) {
            return !otp.data.priority && !otp.data.isDeleted
        }
        if (txt.startsWith('#OK')) {
            return otp.data.priority && !otp.data.isDeleted && !otp.data.isClosed && !otp.data.isBlocked
        }
        if (txt.startsWith('#NO')) {
            return (!otp.data.priority || otp.data.isClosed || otp.data.isBlocked) && !otp.data.isDeleted
        }
        if (txt.startsWith('#OI')) {
            return otp.annotation.currentPeriodAnnotation && otp.annotation.currentPeriodAnnotation.datNextCreance
        }
        if (txt.startsWith('#CR')) {
            return otp.annotation.currentPeriodAnnotation && otp.annotation.currentPeriodAnnotation.datNextCreance2
        }
        if (txt.startsWith('$DO')) {
            return otp.data.documents && otp.data.documents.length > 0
        }

        return otp.data.name.toUpperCase().includes(txt) || otp.annotation.equipe.toUpperCase().includes(txt) || otp.annotation.classification.toUpperCase().includes(txt)
    }

    calculateTotal(otps): number {
        return otps.filter(otp => !otp.data.isDeleted).reduce((acc, otp) => acc + (+otp.annotation.amountAvailable || 0), 0)
    }


    public otpAddInfo = function (otp, otpSapMap) {
        otp.annotation.nbSapItems = otpSapMap.has(otp.data.name) ? otpSapMap.get(otp.data.name).sapIdSet.size : 0
        return otp
    }

    ngOnInit(): void {
        this.stateInit();

        this.sapService.getSapOtpMapObservable().takeWhile(() => this.isPageRunning).subscribe(otpSapMap => {
            this.otpSapMap = otpSapMap
        })

    }

    public isPageRunning: boolean = true


    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    setOtps(otps) {
        this.otps= otps.map(otp => this.otpAddInfo(otp, this.otpSapMap))
    }

    createReport(otps) {

        var fnFormat = otp => {
            this.otpAddInfo(otp, this.otpSapMap)
            return {                
                Otp: otp.data.name,
                Description: otp.data.description,
                Budget: otp.annotation.budget.toLocaleString('fr-BE', {useGrouping: false}),
                Engaged: otp.annotation.amountEngaged.toLocaleString('fr-BE', {useGrouping: false}),
                'Engaged in Krino': otp.annotation.amountSpentNotYetInSap.toLocaleString('fr-BE', {useGrouping: false}),
                Invoiced: otp.annotation.amountBilled.toLocaleString('fr-BE', {useGrouping: false}),
                Available: otp.annotation.amountAvailable.toLocaleString('fr-BE', {useGrouping: false}),
                Until: otp.annotation.currentPeriodAnnotation ? dateUtils.formatShortDate(otp.annotation.currentPeriodAnnotation.datEnd) : 'not for current period',
                Deleted: otp.data.isDeleted ? 'Deleted ' : '',
                Blocked: otp.data.isBlocked ? 'Blocked ' : '',
                Closed: otp.data.isClosed ? 'Closed ' : '',
                Priority: !otp.data.priority ? 'No priority ' : otp.data.priority,
                'Limited to equipe': otp.data.isLimitedToOwner ? 'Limited ' : '',
                Equipe: otp.annotation.equipe,
                'Nb times in Sap': otp.annotation.nbSapItems,
            }
        }

        var listNonDeleted = otps.filter(otp => !otp.data.isDeleted && !otp.data.isBlocked).map(fnFormat)
        var listDeleted = otps.filter(otp => otp.data.isDeleted).map(fnFormat)
        var listBlocked = otps.filter(otp => otp.data.isBlocked).map(fnFormat)

        reportsUtils.generateReport(listNonDeleted.concat(listBlocked).concat(listDeleted))
    }


    getOtpObservable(id: string) {
        return this.otpsObservable.map(otps => otps.filter(otp => otp.data._id === id)[0]);
    }

    showColumn(columnName: string) {
        return !this.config || !this.config['skip'] || !(this.config['skip'] instanceof Array) || !this.config['skip'].includes(columnName);
    }

    // This is typically used for accordions with ngFor, for remembering the open Accordion Panel (see template as well)    
    public beforeAccordionChange($event: NgbPanelChangeEvent) {
        if ($event.nextState) {
            this.state.openPanelId = $event.panelId;
            this.stateChanged.next(this.state);
        }
    };

    // This is typically used for accordions with ngFor and tabsets in the cild component. As the ngFor disposes and recreates the child component, we need a way to remember the opened tab
    public childStateChanged(newState, objectId) {
        this.state[objectId] = newState;
        this.stateChanged.next(this.state);
    }

    public getStatusText(otp): Observable<string> {

        return Observable.combineLatest(this.translationLoaderService.getTranslationWord('OTP.COLUMN.DELETED'), this.translationLoaderService.getTranslationWord('OTP.COLUMN.BLOCKED'), this.translationLoaderService.getTranslationWord('OTP.COLUMN.LIMITED'), 
                                        this.translationLoaderService.getTranslationWord('OTP.COLUMN.CLOSED'), this.translationLoaderService.getTranslationWord('OTP.COLUMN.NO PRIORITY'),
            (deletedTxt, blockedTxt, limitedTxt, closedTxt, noPriorityTxt) => {
                var txt= (otp.data.isDeleted ? (deletedTxt + ' ') : '') + (otp.data.isBlocked ? (blockedTxt + ' ') : '') + ((otp.data.isLimitedToOwner || (otp.data.userIds && otp.data.userIds.length > 0)) ? (limitedTxt + ' ') : '') + (otp.data.isClosed ? (closedTxt + ' ') : '') + (!otp.data.priority ? (noPriorityTxt + ' ') : '') 
                return txt.trim()
            })
    }

}