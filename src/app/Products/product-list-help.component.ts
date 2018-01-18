import {Component, Input} from '@angular/core';


@Component(
    {
        selector: 'gg-product-list-help',
        templateUrl: './product-list-help.component.html'
    }
)
export class ProductListHelpComponent 
{
    @Input() isForSelection: boolean = false
    @Input() showStockage: boolean = false


}