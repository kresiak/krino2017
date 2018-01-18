import {
  Component,
  Input,
  Output,
  ViewEncapsulation,
  EventEmitter} from '@angular/core';

@Component({
   //moduleId: module.id,  
  selector: 'gg-checkbox',
  host: {
    'class': 'checkbox'
  },
  templateUrl: './checkbox.html',
  encapsulation: ViewEncapsulation.None
})
export class Checkbox {
  @Input() label;
  @Input() checked=false;
  @Input() disabled=false;
  @Output() checkedChange = new EventEmitter();

  onCheckedChange(checked) {
    this.checkedChange.next(checked);
  }
}

