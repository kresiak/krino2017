

import {
    Directive,
    HostBinding,
    HostListener,
    Input,
    ViewContainerRef
} from '@angular/core';

@Directive({
    selector: '[appRainbow]'
})
export class RainbowDirective {
    constructor(private _view: ViewContainerRef) {
  } 

    @HostBinding('attr.readOnly') readOnly: boolean= true;

    @Input() appRainbow: any

 /*   ngOnInit(): void {
        //this.readOnly= true
        var x= this.appRainbow
        x.readOnly= true
         let component = (<any>this._view)._element.component
         var parentComponent1 = (<any>this.vcRef.injector)._view.context;
    }
*/
/*  possibleColors = [
    'darksalmon', 'hotpink', 'lightskyblue', 'goldenrod', 'peachpuff',
    'mediumspringgreen', 'cornflowerblue', 'blanchedalmond', 'lightslategrey'
  ];

  @HostBinding('style.color') color: string;
  @HostBinding('style.border-color') borderColor: string;

  @HostListener('keydown') newColor() {
    const colorPick = Math.floor(Math.random() * this.possibleColors.length);

    this.color = this.borderColor = this.possibleColors[colorPick];
  }
*/}