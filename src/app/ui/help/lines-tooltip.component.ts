import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'gg-line-tooltip',
    templateUrl: './lines-tooltip.component.html'
})

export class LinesTooltipComponent implements OnInit {

    @Input() text= '';
    @Input() title= '';
    @Input() lines: string[] = []

    constructor() { }

    ngOnInit(): void {


    }


}
