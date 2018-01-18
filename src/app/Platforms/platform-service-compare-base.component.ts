import { Component, Input, Output, EventEmitter } from '@angular/core'

@Component(
    {
        selector: 'gg-platform-service-compare-base',
        templateUrl: './platform-service-compare-base.component.html'
    }
)
export class PlatformServiceCompareBaseComponent  {

    constructor() {
    }

    @Input() col1: string=''
    @Input() col2: string=''
    @Input() col3: string=''
    @Input() bold1: boolean=false
    @Input() indent: boolean=false

}