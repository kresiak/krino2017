import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core'
import { NavigationService } from './../Shared/Services/navigation.service'
import * as moment from "moment"

@Component(
    {
        selector: 'gg-sap-sheet',
        templateUrl: './sap-sheet.component.html'
    }
)
export class SapSheetComponent implements OnInit {
    constructor(private navigationService: NavigationService) {
    }

    @Input() sapItem: any
    @Input() isFacture: boolean= false
    @Input() path: string

    public sortedItems

    ngOnInit(): void {
        this.sortedItems= this.sapItem.items.sort((a,b) => { 
            var diff= a.poste-b.poste
            if (diff != 0) return diff
                var d1 = moment(a.dateCreation, 'DD/MM/YYYY').toDate()
                var d2 = moment(b.dateCreation, 'DD/MM/YYYY').toDate()
                return d1 > d2 ? -1 : 1

        })
    }


 /*   navigateToProduct(productId) {
        this.navigationService.maximizeOrUnmaximize('/product', productId, this.path, false)
    }*/


}
