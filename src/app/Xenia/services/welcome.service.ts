import { Injectable, Inject } from '@angular/core'
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { DataStore } from 'gg-basic-data-services'
import {utilsComparators as utilsComparator} from 'gg-search-handle-data'


@Injectable()
export class XeniaWelcomeService {
    constructor(private router: Router, private route: ActivatedRoute, @Inject(DataStore) private dataStore: DataStore) { }

    private data: any= {}
    private newDbId: string

    private newDbIdSubject: BehaviorSubject<string>= new BehaviorSubject<any>('')    

    public getNewDbIdObservable(): Observable<any> {
        return this.newDbIdSubject
    }

    public setNameData(name: string='', firstName: string= '') {
        this.data.name= name
        this.data.firstName= firstName
    }

    public setUserId(userId) {
        this.data.userId= userId
    }

    public setEmail(email) {
        this.data.email2= email
    }

    public setPiId(piId) {
        this.data.piId= piId
    }

    public getData() {
        return this.data
    }

    public saveData() {        
        if (this.data.userId) {
            var id= this.data.userId
            delete this.data.userId
            this.dataStore.updateData('users.xenia', id, this.data).first().subscribe(res => {
                this.newDbIdSubject.next(id)
            })
        }
        else {
            delete this.data.userId
            if (this.data.email2==='-1') this.data.email2=''
            this.dataStore.addData('users.xenia', this.data).first().subscribe(res => {
                this.newDbIdSubject.next(res._id)
            })
        }
    }


    private stdNextInfo: any = {
        text: 'next page',
        enabled: false,
        fnExec: undefined
    }

    private stdBackInfo: any = {
        text: 'previous page',
        enabled: true,
        fnExec: undefined
    }

    private nextSubject: BehaviorSubject<any>= new BehaviorSubject<any>(this.stdNextInfo)

    private backSubject: BehaviorSubject<any>= new BehaviorSubject<any>(this.stdBackInfo)

    public getNextObservable(): Observable<any> {
        return this.nextSubject
    }

    public getBackObservable(): Observable<any> {
        return this.backSubject
    }

    private getNextInfo() {
        return utilsComparator.clone(this.nextSubject.getValue())
    }

    private getBackInfo() {
        return utilsComparator.clone(this.backSubject.getValue())
    }


    public nextDisable() {
        var x= this.getNextInfo()
        x.enabled= false
        x.fnExec= undefined
        this.nextSubject.next(x)
    }

    public nextSetText(txt: string) {
        var x= this.getNextInfo()
        x.text= txt
        this.nextSubject.next(x)        
    }

    public nextEnable(fnExec) {
        var x= this.getNextInfo()
        x.enabled= true
        x.fnExec= fnExec
        this.nextSubject.next(x)
    }

    public backDisable() {
        var x= this.getBackInfo()
        x.enabled= false
        x.fnExec= undefined
        this.backSubject.next(x)        
    }

    private pathStack= []

    public reset() {
        this.pathStack= []
        this.data= {}
    }

    private _navigateTo(path) {
        this.nextSubject.next(this.stdNextInfo)
        this.backSubject.next(this.stdBackInfo)
        this.router.navigate(['xenia', 'welcome', path])        
    }

    public navigateTo(path) {
        var getLastSegment= () => {
            var x: any[]= this.router.routerState.snapshot.url.split('/')
            x.reverse()
            return x.length > 0 ? x[0] : undefined
        }
        //this.router.navigate(['../' + path], {relativeTo: this.route})
        this.pathStack.push(getLastSegment())
        this._navigateTo(path)
    }

    public navigateBack() {
        var path= this.pathStack.pop()
        if (path) this._navigateTo(path)
    }
}
