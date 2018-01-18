import { Component, Input, Output, OnInit, OnChanges, ViewEncapsulation, EventEmitter, HostBinding } from '@angular/core';
import * as moment from "moment"

@Component({
    //moduleId: module.id,
    selector: 'gg-editor-date',
    host: {
        'class': 'editor'
    },
    templateUrl: './editor-date.html',
    encapsulation: ViewEncapsulation.None
})
export class EditorDate implements OnInit, OnChanges {
    @Input() readOnly: boolean= false;    
    @Input() content;
    @Input() format= 'DD/MM/YYYY HH:mm:ss'
    @Input() @HostBinding('class.editor--edit-mode') editMode = false;
    @Output() editSaved = new EventEmitter();
    @Output() editSavedWithCancelOption = new EventEmitter();

    private initialized=false;

    public contentEdited;    
    private savedContentEdited;

    toDatePickerDateObject(date: string): Object {
        var md;
        if (!date || date.trim()===''){
            this.content= 'Choose a date'            
            md= moment()
        } 
        else {
            md = moment(date, this.format)
        }

        var obj = { year: md.year(), month: md.month() + 1, day: md.date() };
        return obj;
    }

    fromDatePickerDateObjec(obj: any): string {
        var md = moment() 
        md.year(obj.year)       // Very important to put first year and month and then day, only at the end: otherwise strange effects happen when setting the 31st on any months when the current months has only 30 days 
                                // see https://github.com/moment/moment/issues/2725   Explication: First you create moment() that gives you current date (November 3rd as of today). You try to set its day to 31 but November has only 30 days, so JS native date object "intelligently" adds one day and moves date to 1st December (you can set day to any crazy number, like 42, and JS will do an arithmetic by adding a proper number of days and rewinding month and year if needed, not the best practice, it would have been better if it was throwing).

        md.month(obj.month - 1)
        md.date(obj.day)

        return md.format(this.format);       
    }

    emptyContent() {
        this.contentEdited= this.toDatePickerDateObject('')
    }

    ngOnInit(): void {
        this.contentEdited = this.toDatePickerDateObject(this.content)
        this.initialized= true
    }

    ngOnDestroy():void 
    {
        if (this.editMode) {
            this.save()
        }        
    }

    ngOnChanges(changes) {
        if (! this.initialized) return
        if (changes.content)
        {
            this.contentEdited = this.toDatePickerDateObject(this.content)
        }
    } 

    save() {
        this.content = this.fromDatePickerDateObjec(this.contentEdited);
        this.editSaved.next(this.content);
        this.editSavedWithCancelOption.next({
            value: this.content,
            fnCancel: () => {
                this.content = this.fromDatePickerDateObjec(this.savedContentEdited);
                this.contentEdited = this.savedContentEdited;
            }
        })
        this.editMode = false;
    }

    cancel() {
        this.contentEdited = this.savedContentEdited;
        this.editMode = false;
    }

    edit() {
        this.savedContentEdited= this.contentEdited;
        this.editMode = true;
    }

}
