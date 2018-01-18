import { Component, Input, Output, OnInit, OnChanges, ViewEncapsulation, EventEmitter, HostBinding } from '@angular/core';

@Component({
    //moduleId: module.id,
    selector: 'gg-editor-tinymce',
    host: {
        'class': 'editor'
    },
    templateUrl: './editor-tnymce.html',
    encapsulation: ViewEncapsulation.None
})
export class EditorTinyMce implements OnInit, OnChanges {
    private static counter: number= 0
    @Input() content;
    @Input() @HostBinding('class.editor--edit-mode') editMode = false;
    @Output() editSaved = new EventEmitter();

    public contentEdited;    
    public id: number

    constructor() {
        this.id= EditorTinyMce.counter++
    }

    ngOnInit(): void {
        this.contentEdited = this.content;        
    }

    ngOnChanges(changes) {
        if (changes.content)
        {
            this.contentEdited= changes.content.currentValue;
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

    tinymceChanged(content) {
        this.contentEdited= content
    }

}
