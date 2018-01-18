import {Observable} from 'rxjs/Rx';
import {Injectable, Inject} from '@angular/core'
import { DataStore } from './data.service'
import { ConfigService } from './config.service'

@Injectable()
export class WebSocketService{

    constructor(@Inject(DataStore) private dataStore: DataStore, @Inject(ConfigService) private configService: ConfigService)
    {
        if (configService.isProduction()) {
            if (configService.isVM2()) { 
                this.url =    'ws://139.165.57.34:80'
            }
            else {
                this.url =    'ws://139.165.56.57:3002'
            }
        }
        else {
            this.url =   'ws://localhost:1337';
        }
    }

    
    ws: WebSocket;
    private url; 

    init() {
        this.createObservableSocket().subscribe(data => {
            let obj= JSON.parse(data)
            if (obj && obj.collectionsUpdated){
                (obj.collectionsUpdated as any[]).forEach(collection => {
                    this.dataStore.triggerDataNext(collection)
                })
            }
        })
    }

    requeryDb() {
        this.dataStore.RetriggerAll()
    }

    private createObservableSocket():Observable<any>{

        this.ws = new WebSocket(this.url);

        return new Observable(
          observer => {

            this.ws.onmessage = (event) =>
                      observer.next(event.data);

            this.ws.onerror = (event) => {
                console.log('WebSocket error')
                observer.error(event)
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket closed')
                observer.complete()
                this.init()
                this.requeryDb()
            };

        }
     );
    }

    sendMessage(message: any){
        this.ws.send(message);
    }
}