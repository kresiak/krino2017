import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { Observable } from 'rxjs/Rx'
import { TeambuilderService } from '../services/teambuilder.service'
import { AuthService } from '../services/authorization.service'
import { DataStore } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { SignedInStatusInfo } from '../services/authorization.service';

@Component(
    {
        selector: 'gg-organi-giga-main',
        templateUrl: './organi.giga-main.component.html'
    }
)
export class OrganiGigaMain implements OnInit {
    authorizationStatusInfo: SignedInStatusInfo;
    personsObservable: Observable<any>;
    personsPiObservable: Observable<any>;
    unitsObservable: Observable<any[]>;

    isPageRunning: boolean = true;

    constructor(private teambuilderService: TeambuilderService, private dataStore: DataStore, private authService: AuthService) {
    }

    annotatedLaboToMail: any[]

    ngOnInit(): void {
        this.unitsObservable = this.teambuilderService.getUnitsAnnotated()

        this.personsObservable = this.teambuilderService.getPersonsAnnotated()

        this.personsPiObservable = this.teambuilderService.getPersonsPisAnnotatedWithExceptions([])

        this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })

        Observable.combineLatest(this.personsObservable, this.dataStore.getDataObservable('users.giga.labos'), (personsAnnotated, labos) => {
            return labos.filter(labo => !labo.mailSent && !labo.disabled).map(labo => {
                var theLaboChef = personsAnnotated.filter(p => p.data._id === labo.directorId)[0]
                return {
                    data: labo,
                    annotation: {
                        chef: theLaboChef ? theLaboChef : undefined
                    }
                }
            })
        }).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.annotatedLaboToMail = res
        })
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    loginHasBeenTried(data) {
        this.authService.tryLogin(data.user, data.password)
    }

    //this.teambuilderService.mailTBLaboDir('benoit.ernst@uliege.be', '59fd991b1fdf3e542868c11d').subscribe((res) => {

    testEmail= 'kvasza@gmail.com' //benoit.ernst@uliege.be
    testOnServer: boolean= false
    sendToTestEmail: boolean= true

    private sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }

    sendMails() {
        this.annotatedLaboToMail.forEach(labo => {
            this.teambuilderService.mailTBLaboDir(this.sendToTestEmail ? this.testEmail : labo.annotation.chef.data.email, 
                            labo.annotation.chef.data.firstName, labo.annotation.chef.data._id, this.testOnServer).subscribe((res) => {
                labo.data.mailSent= true
                this.dataStore.updateData('users.giga.labos', labo.data._id, labo.data)
                console.log(labo.annotation.chef.data.email, 'done')
            }, (err) => {
                labo.data.mailError= err
                this.dataStore.updateData('users.giga.labos', labo.data._id, labo.data)
                console.log('there is an error ' + labo.annotation.chef.data.email + ': ' + err)
            })
/*             console.log('sleeping')
            this.sleep(5000)
            console.log('waking up')
 */        })
    }
}

