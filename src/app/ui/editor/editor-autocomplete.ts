import { Component, Input, Output, OnInit, OnChanges, ViewEncapsulation, EventEmitter, HostBinding, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs/Rx'
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { SelectableData } from 'gg-basic-code'
import { NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap'

@Component({
    //moduleId: module.id,
    selector: 'gg-editor-autocomplete',
    host: {
        'class': 'editor'
    },
    templateUrl: './editor-autocomplete.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorAutocomplete implements OnInit {
    constructor(private _sanitizer: DomSanitizer) {

    }
    @Input() readOnly: boolean = false;
    @Input() selectableData: Observable<SelectableData[]>;
    @Input() selectedId: string
    @Input() emptyContentText: string = ''
    @Input() linkable: boolean = false
    @Input() timeoutSeconds: number = 5 * 60;

    @Input() @HostBinding('class.editor--edit-mode') editMode = false;
    @Output() idChanged = new EventEmitter();
    @Output() hasBeenClicked = new EventEmitter();
    @Output() hasBeenCanceled = new EventEmitter();

    public content;
    public selectedItem;

    private initContent(selectedId: Observable<string>): void {
        this.selectableData.combineLatest(selectedId, (sdata, id) => {
            var selectedItem = sdata && id ? sdata.filter(item => id === item.id)[0] : undefined;
            return selectedItem
        }).subscribe(item => {
            this.selectedItem = item
            this.content = item ? item.name : this.emptyContentText
        });
    }

    click$ = new Subject<string>();

    search = (text$: Observable<string>) =>
        text$
            .debounceTime(200).distinctUntilChanged()
            .switchMap((term: string) => {
                return this.selectableData.map(sd => !term ? sd : sd.filter(item => item.name.toLowerCase().includes(term.toLowerCase())).slice(0, 10))
            })
            .do(x => console.log(x))

    formatter = (x: { name: string }) => {
        return x.name
    };
    formatter2 = (x: { name: string }) => {
        return x.name || ''
    };

    onclick() {
        this.selectedItem = { name: '' };
        //this.click$.next('')
    }


    ngOnInit(): void {
        this.initContent(Observable.from([this.selectedId]))
    }

    ngOnDestroy(): void {
        this.cancelTimer()
        if (this.editMode) {
            this.save()
        }
    }

    ngOnChanges(changes) {
        if (changes.selectedId) {
            this.initContent(Observable.from([changes.selectedId.currentValue]))
        }
    }

    save() {
        this.cancelTimer()
        this.idChanged.next(this.selectedItem ? this.selectedItem.id : undefined)
        this.initContent(Observable.from([this.selectedItem ? this.selectedItem.id : undefined]))
        this.editMode = false
    }

    cancel() {
        this.cancelTimer()
        this.editMode = false;
        this.hasBeenCanceled.next()
    }

    edit() {
        this.editMode = true;
        //this.click$.next('')
    }

    autocompleListFormatter = (data: SelectableData): SafeHtml => {
        let html = `<span>${data.name}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    }

    clicked() {
        this.hasBeenClicked.next()
    }

    private timerId = undefined

    cancelTimer() {
        if (this.timerId) {
            clearTimeout(this.timerId)
            this.timerId = undefined
        }
    }


    onSelected(event: NgbTypeaheadSelectItemEvent) {
        this.selectedItem = event.item
        this.cancelTimer()

        this.timerId = setTimeout(() => {
            this.save()
        }, this.timeoutSeconds * 1000)
    }
}
