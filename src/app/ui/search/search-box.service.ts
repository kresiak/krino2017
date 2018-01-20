import { Injectable } from '@angular/core';

@Injectable()
export class SearchBoxService {

  constructor() { }

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

}
