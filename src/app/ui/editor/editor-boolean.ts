import { Component, Input, Output, OnInit, OnChanges, ViewEncapsulation, EventEmitter, HostBinding } from '@angular/core';

@Component({
    //moduleId: module.id,
    selector: 'gg-editor-boolean',
    host: {
        'class': 'editor'
    },
    templateUrl: './editor-boolean.html',
    encapsulation: ViewEncapsulation.None
})
export class EditorBoolean implements OnInit, OnChanges {
    @Input() readOnly: boolean= false;    
    @Input() content;
    @Input() @HostBinding('class.editor--edit-mode') editMode = false;
    @Output() editSaved = new EventEmitter();

    public contentEdited;    

    ngOnInit(): void {
        this.contentEdited = this.content
    }

    ngOnDestroy():void 
    {
        if (this.editMode) {
            this.save()
        }        
    }
   
    ngOnChanges(changes) {
        if (changes.content)
        {
            this.contentEdited = this.content
        }
    } 

    save() {
        this.content = this.contentEdited;
        this.editSaved.next(this.content);
        this.editMode = false;
    }

    cancel() {
        this.contentEdited = this.content;
        this.editMode = false;
    }

    edit() {
        this.editMode = true;
    }

    setSelection(newValue) {
        this.contentEdited= newValue 
    }

    getTextBoolean() {
        return this.content ? 'UI.GENERAL.YES' : 'UI.GENERAL.NO'
    }
}
