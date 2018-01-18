import { Injectable } from '@angular/core'
import { ReplaySubject } from "rxjs/Rx";
import { Observable, Subscription } from 'rxjs/Rx'

import { ApiService } from './api.service';


@Injectable()

export class DataStore { // contains one observable property by database table/collection

    constructor(private apiService: ApiService) {
        this.laboName = 'undefined'
        var laboFromLS = localStorage.getItem(this.LSLaboKey)
        if (laboFromLS) {
            this.laboName = laboFromLS
        }
        this.emitLaboName()
    }

    private laboNameSubject: ReplaySubject<string> = new ReplaySubject(1)

    public getLaboNameObservable(): Observable<any> {
        return this.laboNameSubject
    }

    public getLaboObservable(): Observable<any> {
        return this.getLaboNameObservable().switchMap(laboName => {
            return this.getDataObservable('labos.list').map(labos => labos.filter(labo => labo.shortcut === laboName)[0])
        })
    }



    public getLaboResponsablesObservable(): Observable<any> {
        return this.getLaboObservable().map(theLabo => theLabo ? (theLabo.responsables || []) : [])
/*        return this.getLaboNameObservable().switchMap(laboName => {
            return this.getDataObservable('labos.list').map(labos => labos.filter(labo => labo.shortcut === laboName)[0])
                        .map(theLabo => theLabo ? (theLabo.responsables || []) : [])
        })
*/    }

    private emitLaboName() {
        this.laboNameSubject.next(this.laboName === 'undefined' ? '' : this.laboName)
    }

    private laboFieldName: string = 'laboName'

    private universalTables: string[] = ['products', 'suppliers', 'categories', 'labos.list', 'otp.product.classifications', 'sap.engage', 'sap.fusion', 'sap.supplier', 'sap.engage.map', 'users.public',
        'products.market', 'platform.enterprises', 'platform.clients', 'currencies', 'users.giga', 'users.giga.functions', 'users.giga.functions.new', 'users.giga.thematic.units', 'users.giga.teams']

    //public laboName= 'demo' 
    //public laboName = 'michel'
    private laboName: string = 'undefined' // = 'genomics'
    private LSLaboKey: string = 'krinoLabo'


    public getLaboName(): string {
        return this.laboName
    }

    public getPictureUrl(filename: string) {
        if (!filename) return undefined
        return this.apiService.getPictureUrlBase() + '/' + filename
    }

    public getUploadUrl() {
        return this.apiService.urlBaseForUpload
    }

    public setLaboName(labo: string) {
        this.laboName = labo ? labo : 'undefined'
        localStorage.setItem(this.LSLaboKey, labo)
        this.RetriggerAll()
        this.emitLaboName()
    }

    private isFromRightLabo(table, rec): boolean {
        let laboNameInRecord = rec[this.laboFieldName]

        if ((this.universalTables.includes(table) || table.includes('xenia')) && !rec.isLabo) return true

        if (this.laboName === 'michel') return !laboNameInRecord || laboNameInRecord === this.laboName
        return laboNameInRecord === this.laboName
    }


    public RetriggerAll() {
        Object.keys(this).forEach(propName => {
            if (this[propName] instanceof ReplaySubject && propName != 'laboNameSubject') {
                this.triggerNext(propName)
            }
        })
    }

    private triggerNext(table: string) {
        if (!this[table]) {
            this[table] = new ReplaySubject<any[]>(1);
        }

        this.apiService.crudGetRecords(table).subscribe(
            res => {
                var res2 = res.filter(record => this.isFromRightLabo(table, record))
                this[table].next(res2);
            },
            err => console.log("Error retrieving Todos"),
            () => console.log("completed " + table)
        );
    }

    setLaboNameOnRecord(record) {
        record[this.laboFieldName] = this.laboName
    }

    private getObservable(table: string): ReplaySubject<any[]> {
        if (!this[table]) {
            this[table] = new ReplaySubject<any[]>(1);
            this.triggerNext(table);
        }
        return this[table];
    }

    getDataObservable(table: string) {
        return this.getObservable(table);
    }

    addData(table: string, newRecord: any): Observable<any> {
        newRecord[this.laboFieldName] = this.laboName
        let obs = this.apiService.crudCreateRecord(table, newRecord);
        obs.subscribe(res => {
            //this.triggerNext(table)
        });
        return obs;
    };

    addDataWithoutLabo(table: string, newRecord: any): Observable<any> {
        let obs = this.apiService.crudCreateRecord(table, newRecord);
        obs.subscribe(res => {
            //this.triggerNext(table)
        });
        return obs;
    };

    deleteData(table: string, id: string): Observable<any> {
        let obs = this.apiService.crudDeleteRecord(table, id);
        obs.subscribe(res => {
            //this.triggerNext(table)
        });
        return obs;
    }

    updateData(table: string, id: string, newRecord: any): Observable<any> {
        newRecord[this.laboFieldName] = this.laboName   // to be sure
        let obs = this.apiService.crudUpdateRecord(table, id, newRecord);
        obs.subscribe(res => {
            //this.triggerNext(table)
        });
        return obs;
    }

    triggerDataNext(table: string) {
        this.triggerNext(table);
    }

    // For example: equipe records contain the list of user Ids... If you want to update the list of users for an equipe, it is easy. But if you want to update the list of equipes for a user? This can be used...

    reverseFKUpdate(tableName: string, fieldName: string, selectedIds: string[], foreignObjectId: string) {
        this.getDataObservable(tableName).map(records => records.filter(e => e[fieldName].includes(foreignObjectId)).map(e => e._id)).first().subscribe(beforeIds => {
            var toAddIds = selectedIds.filter(id => !beforeIds.includes(id))
            var toDeleteIds = beforeIds.filter(id => !selectedIds.includes(id))

            toAddIds.forEach(objId => {
                this.getDataObservable(tableName).first().map(objects => objects.filter(obj => obj._id === objId)[0])
                    .do(obj => {
                        if (!obj[fieldName]) obj[fieldName] = []
                        if (!obj[fieldName].includes(foreignObjectId)) {
                            obj[fieldName].push(foreignObjectId)
                            this.updateData(tableName, obj._id, obj)
                        }
                    }).subscribe()
            })
            toDeleteIds.forEach(objId => {
                this.getDataObservable(tableName).first().map(objects => objects.filter(obj => obj._id === objId)[0])
                    .do(obj => {
                        if (!obj[fieldName]) obj[fieldName] = []
                        if (obj[fieldName].includes(foreignObjectId)) {
                            var pos = obj[fieldName].findIndex(id => id === foreignObjectId);
                            obj[fieldName].splice(pos, 1);
                            this.updateData(tableName, obj._id, obj)
                        }
                    }).subscribe()
            })
        })
    }


}