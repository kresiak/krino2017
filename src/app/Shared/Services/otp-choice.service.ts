import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { AuthService } from './auth.service'
import { OrderService } from './order.service'
import { Observable, Subscription } from 'rxjs/Rx'
import { OtpService } from './otp.service'
import * as utilsDate from './../Utils/dates'
import * as moment from "moment"


Injectable()
export class OtpChoiceService {

    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService,
        @Inject(OrderService) private orderService: OrderService, @Inject(OtpService) private otpService: OtpService) {

    }

    private getCompatibleOtps(currentEquipeId, currentUserId, valueToSpend, productClassificationIds, annotatedOtps, isFixCostProduct: boolean= false) {
        return !annotatedOtps ? [] :
            annotatedOtps
                .filter(otp =>
                    !otp.data.isLimitedToOwner || otp.data.equipeId === currentEquipeId)
                .filter(otp =>
                    (otp.data.userIds || []).length === 0 || otp.data.userIds.includes(currentUserId))
                .filter(otp => !otp.data.isBlocked && !otp.data.isClosed && !otp.data.isDeleted && otp.annotation.currentPeriodAnnotation)
                .filter(otp => otp.annotation.amountAvailable > valueToSpend)
                .filter(otp => {
                    let allowedClassifications: string[] = otp.data.classificationIds ? otp.data.classificationIds : []
                    return allowedClassifications.filter(otpClassification => productClassificationIds.includes(otpClassification)).length > 0 || (isFixCostProduct && !otp.data.excludeFixCost);
                })
                .filter(otp => otp.data.priority > 0)
                .sort((o1, o2) => {
                    function getRelevantDate(o) {
                        return o.annotation.currentPeriodAnnotation.datNextCreance || o.annotation.currentPeriodAnnotation.datEnd
                    }

                    var d1 = moment(getRelevantDate(o1), 'DD/MM/YYYY').toDate()
                    var d2 = moment(getRelevantDate(o2), 'DD/MM/YYYY').toDate()

                    return d1 < d2 ? -1 : (d1 > d2 ? 1 : +o1.data.priority - +o2.data.priority)
                });
    }

    getCompatibleOtpsObservable(currentEquipeId, currentUserId, valueToSpend, productClassificationId) : Observable<any> {
        return this.otpService.getAnnotatedOtpsMap().map(otpsBudgetMap => Array.from(otpsBudgetMap.values())).map(annotatedOtps => this.getCompatibleOtps(currentEquipeId, currentUserId, valueToSpend, [productClassificationId], annotatedOtps))
    }

    determineOtp(product, classifications: any[], quantity: number, otpsBudgetMap, currentEquipeId: string, currentUserId: string): any {
        var totalPrice = +product.price * quantity * 1.21;
        let productCategories: string[] = product.categoryIds ? product.categoryIds : []
        let productClassifications: string[] = classifications.filter(c => c.categoryIds && c.categoryIds.filter(catId => productCategories.includes(catId)).length > 0).map(c => c._id)
        var isFixCostProduct = product.isFixCost

        var annotatedOtps: any[] = Array.from(otpsBudgetMap.values())

        let possibleOtps = this.getCompatibleOtps(currentEquipeId, currentUserId, totalPrice, productClassifications, annotatedOtps, isFixCostProduct)
        
        var pos = 0;// Math.floor(Math.random() * possibleOtps.length)

        return possibleOtps.length > 0 ?
            {
                _id: possibleOtps[pos].data._id,
                name: possibleOtps[pos].data.name,
                description: possibleOtps[pos].data.description
            } :
            {
                _id: undefined,
                name: 'no available Otp',
                description: ''
            };
    }
}

