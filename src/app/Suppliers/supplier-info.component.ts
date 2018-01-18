import { Component, OnInit, Input } from '@angular/core'

@Component(
    {
        selector: 'gg-supplier-info',
        templateUrl: './supplier-info.component.html'
    }
)

export class SupplierInfoComponent implements OnInit {
    ngOnInit(): void {}
    constructor() {}

    @Input() supplier; 
  
}