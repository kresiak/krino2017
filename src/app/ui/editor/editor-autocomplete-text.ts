import { Component, Input, Output, OnInit, OnChanges, ViewEncapsulation, EventEmitter, HostBinding } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { SelectableData } from '../../Shared/Classes/selectable-data'

@Component({
    //moduleId: module.id,
    selector: 'gg-editor-autocomplete-text',
    host: {
        'class': 'editor'
    },
    templateUrl: './editor-autocomplete-text.html',
    encapsulation: ViewEncapsulation.None
})
export class EditorAutocompleteText implements OnInit {
    constructor(private _sanitizer: DomSanitizer) {

    }
    @Input() readOnly: boolean = false;
    @Input() limitToChoice: boolean = false;
    @Input() selectableData: string[];
    @Input() selectedText: string
    @Input() emptyContentText: string = ''

    @Input() @HostBinding('class.editor--edit-mode') editMode = false;
    @Output() textChanged = new EventEmitter();

    public content;
    public selectedItem;

    ngOnInit(): void {
        this.content = this.selectedText || this.emptyContentText
    }

    ngOnDestroy():void 
    {
        if (this.editMode) {
            this.save()
        }        
    }

    save() {
        if (this.limitToChoice && !this.selectableData.includes(this.selectedItem))  
        {
            this.selectedItem= this.content
            return
        }

        this.textChanged.next(this.selectedItem)
        this.content = this.selectedItem
        this.editMode = false
    }

    cancel() {
        this.editMode = false;
    }

    edit() {
        this.selectedItem= this.content
        this.editMode = true;
    }

    /*   autocompleListFormatter = (data: SelectableData): SafeHtml => {
           let html = `<span>${data.name}</span>`;
           return this._sanitizer.bypassSecurityTrustHtml(html);
       }
   */

}
