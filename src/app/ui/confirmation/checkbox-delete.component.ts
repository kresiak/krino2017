import {
    Component,
    Input,
    Output,
    ViewEncapsulation,
    EventEmitter
} from '@angular/core';

@Component({
    selector: 'gg-checkbox-delete',
    templateUrl: './checkbox-delete.component.html'
})
export class CheckboxDelete {
    @Input() typeObjectKey: string= 'UI.CHECKBOX DELETE.OBJECT';
    @Output() doDelete = new EventEmitter();

    public isDueToDelete: boolean= false
    public hideAll: boolean= false

    onCheckedChange() {
        if (this.isDueToDelete)
            this.doDelete.next();
        this.hideAll= true    
    }
}

