import { Observable, Subscription, ConnectableObservable } from 'rxjs/Rx'

export class SharedObservable
{
    private observable: ConnectableObservable<any>

    private usedYet: boolean= false

    constructor(observable: Observable<any>)
    {
        this.observable= observable.publishReplay(1)
    };

    getObservable() : Observable<any> {
        if (!this.usedYet) {
            this.observable.connect()
            this.usedYet= true
        }
        return  this.observable
    }

}