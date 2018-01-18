import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'gg-date-pointer',
    templateUrl: './date-pointer.component.html'
})

export class DatePointerComponent implements OnInit {
  
    @Input() date;
    
    constructor() {
    }

    ngOnInit(): void {
    }

    
}
