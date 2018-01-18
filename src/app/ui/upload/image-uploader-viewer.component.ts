import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core'
import { DataStore } from './../../Shared/Services/data.service'

@Component({
    selector: 'gg-image-uploader-viewer',
    templateUrl: 'image-uploader-viewer.component.html'
})
export class ImageUploaderViewerComponent {

    @Input() documents
    @Input() canUserChange: boolean = false
    @Input() canUserAdd: boolean = false
    @Output() imagesChanged = new EventEmitter()

    @ViewChild('uploader') imageUploadComponent;

    constructor(public dataStore: DataStore) { }

    ngOnInit():void {
        if (!this.documents)
            this.documents=[]
    }

    deleteDocument(docPos) {
        this.documents.splice(docPos, 1)
        this.imagesChanged.next(this.documents)
    }

    onUploadFinished(newDocuments) {
        if (newDocuments && newDocuments.length === 1) {
            this.documents.push(newDocuments[0])
            this.imageUploadComponent.clearPictures()
            this.imagesChanged.next(this.documents)
        }
    }

    isImage(document) {
        var images= ['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'TIF' ]
        return images.filter(i => document.filename.toUpperCase().endsWith(i)).length > 0
    }

    descriptionUpdated(document, newDescription) {
        document.description= newDescription
        this.imagesChanged.next(this.documents)
    }
}