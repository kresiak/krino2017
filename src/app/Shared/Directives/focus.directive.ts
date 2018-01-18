import {
    Directive,
    HostBinding,
    HostListener,
    Input,
    ViewContainerRef,
    OnInit,
    ElementRef,
    Renderer
} from '@angular/core';


@Directive({ selector: '[ggFocus]' })
export class FocusDirective implements OnInit {
 
  @Input('ggFocus') isFocused: boolean;
 
  constructor(private hostElement: ElementRef, private renderer: Renderer) {}
 
  ngOnInit() {
    if (this.isFocused) {
      this.renderer.invokeElementMethod(this.hostElement.nativeElement, 'focus');
    }
  }
}