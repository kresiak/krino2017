import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core'
import { UploadMetadata, FileHolder, ImageUploadComponent } from "angular2-image-upload";
import { DataStore } from './../../Shared/Services/data.service'

@Component({
    selector: 'gg-image-uploader',
    templateUrl: 'image-uploader.component.html'
})
export class ImageUploaderComponent {

    @Input() maxNbOfFiles = 5
    @Output() imagesChanged= new EventEmitter()

    @ViewChild(ImageUploadComponent) imageUploadComponent: ImageUploadComponent;

    constructor(public dataStore: DataStore) { }

    public createOurFileObj(file) {
        return {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified
        }
    }

    public fileDocuments: any[] = []

    public getServerFileName(res) {
        var x = JSON.parse(res.serverResponse._body)
        var filename = x ? x.filename : 'unknown'
        return filename
    }

    public clearPictures() {
        this.imageUploadComponent.deleteAll()
    }
    
    public onUploadFinished(res) {
        var filename = this.getServerFileName(res)

        this.fileDocuments.push(
            {
                file: this.createOurFileObj(res.file),
                filename: filename
            }
        )
        this.imagesChanged.next(this.fileDocuments)
    }

    public onBeforeUpload = (metadata: UploadMetadata) => {
        if (!metadata || !metadata.file) {
            metadata.abort = true
            return metadata
        }
        var ab = this.createOurFileObj(metadata.file)
        var x = JSON.stringify(ab)
        if (this.fileDocuments.map(f => JSON.stringify(f.file)).includes(x))
            metadata.abort = true

        return metadata;
    };

    public onRemoved(res: FileHolder) {
        var filename = this.getServerFileName(res)
        var theFile = this.fileDocuments.filter(fn => fn.filename === filename)[0]
        if (theFile) {
            var index = this.fileDocuments.indexOf(theFile)
            if (index > -1) {
                this.fileDocuments.splice(index, 1)
            }
            this.imagesChanged.next(this.fileDocuments)        
        }
    }


}