import { Injectable, Inject } from '@angular/core'
import { TranslateService, LangChangeEvent } from '@ngx-translate/core'
import { Observable} from 'rxjs/Rx'
import { environment } from '../../../environments/environment';

@Injectable()
export class ConfigService {

    constructor(private translate: TranslateService) {

    }

    isProduction(): boolean {
        return environment.production      //A5
    }

    isVM2(): boolean {
        return true
    }


    private listSaveMap= new Map<string, any>()

    private getMapElement(listType: string): any {
        if (!this.listSaveMap.has(listType)) this.listSaveMap.set(listType, {searchTxt:'', nbHits: -1})
        return this.listSaveMap.get(listType)
    }

    listSaveSearchText(listType: string, searchTxt: string) {
        var elem= this.getMapElement(listType)
        elem.searchTxt= searchTxt
        this.listSaveMap.set(listType, elem)
    }

    listGetSearchText(listType: string) {
        return this.getMapElement(listType).searchTxt
    }

    listSaveNbHits(listType: string, nbHits: number) {
        var elem= this.getMapElement(listType)
        elem.nbHits= nbHits
        this.listSaveMap.set(listType, elem)
    }

    listGetNbHits(listType: string, defaultNb:number) {
        var n= this.getMapElement(listType).nbHits
        return n != -1 ? n : defaultNb
    }


    getTranslationWord(key: string): Observable<string> {
        return Observable.combineLatest(this.translate.get(key), this.translate.onLangChange.startWith(undefined), (translation, event: LangChangeEvent) => {
            if (! event) return translation || key
            var keyArr= key.split('.')
            var value= keyArr.reduce((acc, key) => {
                return acc ? acc[key] : undefined
            }, event.translations)
            return value || key
        })
    }

}