import { Injectable, Inject } from '@angular/core'
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable'
import { ConfigService } from './config.service'


@Injectable()
export class ApiService {
    private urlBaseForData
    private urlBaseForService
    private urlBaseForPicture
    public urlBaseForUpload

    // @Inject decorator is not needed: see https://toddmotto.com/angular-dependency-injection    
    constructor(private _http: HttpClient, private configService: ConfigService) {
        if (configService.isProduction()) {
            if (configService.isVM2()) {
                this.urlBaseForData = 'http://139.165.57.34:80/data'
                this.urlBaseForService = 'http://139.165.57.34:80/service'
                this.urlBaseForPicture = 'http://139.165.57.34:80/pictures'
                this.urlBaseForUpload = "http://139.165.57.34:80/upload"
            }
            else {
                this.urlBaseForData = 'http://139.165.56.57:3002/data'
                this.urlBaseForService = 'http://139.165.56.57:3002/service'
                this.urlBaseForPicture = 'http://139.165.56.57:3002/pictures'
                this.urlBaseForUpload = "http://139.165.56.57:3002/upload"
            }
        }
        else {
            this.urlBaseForData = 'http://localhost:1337/data'
            this.urlBaseForService = 'http://localhost:1337/service'
            this.urlBaseForPicture = 'http://localhost:1337/pictures'
            this.urlBaseForUpload = "http://localhost:1337/upload"
        }
    }

    public getPictureUrlBase() {
        return this.urlBaseForPicture
    }

    callWebService(service, record): Observable<any> {
        return this._http.post(`${this.urlBaseForService}/${service}`, record).share()
            .catch(this.logError);
    }

    crudGetRecords(table: string) {
        return this._http.get(`${this.urlBaseForData}/${table}`)
            //.share()
            .catch(this.logError);
    }

    crudGetRecord(table: string, id: string) {
        return this._http.get(`${this.urlBaseForData}/${table}/${id}`)
            .share()
            .catch(this.logError);
    }

    crudUpdateRecord(table: string, id: string, record: any) {
        return this._http.put(`${this.urlBaseForData}/${table}/${id}`, record).share()
            .catch(this.logError);
    }

    crudCreateRecord(table: string, record) {
        return this._http.post(`${this.urlBaseForData}/${table}`, record)
            .share()
            .catch(this.logError);
    }

    crudDeleteRecord(table: string, id: string) {
        return this._http.delete(`${this.urlBaseForData}/${table}/${id}`).share()
            .catch(this.logError);
    }

    // Error handling 
    private logError(error: Error) {
        return Observable.throw(error || 'There was an error with the request');
    }
}
