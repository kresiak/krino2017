import {
    Component,
    Input,
    Output,
    ViewEncapsulation,
    EventEmitter
} from '@angular/core';

@Component({
    selector: 'gg-button-action-confirm',
    templateUrl: './button-action.component.html'
})
export class ButtonActionConfirm {
    @Input() typeObjectKey: string= 'UI.CHECKBOX DELETE.OBJECT';
    @Input() typeActionKey: string= 'UI.ACTION BUTTON.ACTION';
    @Output() doAction = new EventEmitter();

    public isDueToAct: boolean= false
    public hideAll: boolean= false

    onAccept() {
        if (this.isDueToAct)
            this.doAction.next();
        this.hideAll= true    
    }
}

