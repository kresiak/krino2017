import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router'
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { AuthenticationStatusInfo, AuthService } from './Shared/Services/auth.service'
import { NotificationService } from './Shared/Services/notification.service'
import { BasketService } from './Shared/Services/basket.service'
import { MenuService } from './Shared/Services/menu.service'
import { DataStore, WebSocketService, ConfigService } from 'gg-basic-data-services'
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import {TranslateService} from '@ngx-translate/core'
import { environment } from '../environments/environment';

@Component({
    //moduleId: module.id,
    selector: 'giga-app',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
    constructor(private authService: AuthService, private dataStore: DataStore, public menuService: MenuService, private notificationService: NotificationService, private basketService: BasketService,
        private router: Router, private modalService: NgbModal, private webSocketService: WebSocketService, private _sanitizer: DomSanitizer, public translate: TranslateService,
        private configService: ConfigService) {

        this.configService.setProduction(environment.production)

        this.webSocketService.init()
        this.authService.initFromLocalStorage()

        setTimeout(() => {
            this.webSocketService.requeryDb()
        }, 3 * 60 * 60 * 1000)
    }

    public showScrollText: boolean = true


    public password: string = ''
    public usersShort: any[];
    public possibleEquipes: any[];
    public laboList: any[]
    public authorizationStatusInfo: AuthenticationStatusInfo

    public userValue
    public equipeValue
    public labManagerMessages

    public isPageRunning: boolean = true

    public nbProductsInBasket: number = 0

    public needsEquipeSelection: boolean = true


    public inDbInitialisationProcess: boolean = true
    public laboName: string= ''


    ngOnInit(): void {

        this.notificationService.getLmWarningMessages().takeWhile(() => this.isPageRunning).subscribe(res => {
            this.labManagerMessages = res
        })

        this.basketService.getBasketItemsForCurrentUser().takeWhile(() => this.isPageRunning).subscribe(items => {
            this.nbProductsInBasket = items.length
        })

        Observable.combineLatest(
            this.dataStore.getLaboNameObservable().takeWhile(() => this.isPageRunning), 
            this.dataStore.getDataObservable('labos.list').map(labos => labos.map(labo => {
            return {
                id: labo.shortcut,
                value: labo.name
            }
                })).takeWhile(() => this.isPageRunning), 
        (laboName, laboList) => {
            return {
                laboName: laboName,
                laboList: laboList
            }
        }).do(info => {
            this.laboList= info.laboList
            var labo= info.laboList.filter(l => l.id === info.laboName)[0]
            this.laboName= labo ? labo.value : undefined
        }).subscribe(res => {

        })

        Observable.combineLatest(this.authService.getUserSimpleListObservable().takeWhile(() => this.isPageRunning), this.authService.getStatusObservable().takeWhile(() => this.isPageRunning), (usersShort, statusInfo) => {
            return {
                usersShort: usersShort,
                statusInfo: statusInfo
            }
        }).do(info => {
            this.authorizationStatusInfo = info.statusInfo
            this.usersShort= info.usersShort

            this.userValue = this.usersShort.filter(user => user.id === info.statusInfo.currentUserId)[0]

            this.needsEquipeSelection= !this.userValue ? true : !(this.usersShort.filter(u => u.id === info.statusInfo.currentUserId)[0] || {equipeNotNeeded: false}).equipeNotNeeded

        }).switchMap(info => {
            return  this.authService.getPossibleEquipeSimpleListObservable(this.authorizationStatusInfo).takeWhile(() => this.isPageRunning)
        }).do(possibleEquipes => {
            this.possibleEquipes = possibleEquipes
            this.equipeValue = this.possibleEquipes.filter(eq => eq.id === this.authorizationStatusInfo.currentEquipeId)[0]
        })
        .takeWhile(() => this.isPageRunning).subscribe(res => {
            this.inDbInitialisationProcess= false
        })       
    }

    ngOnDestroy(): void {
        this.isPageRunning = false
    }


    openModal(template) {
        this.showScrollText = true
        var ref = this.modalService.open(template, { keyboard: false, backdrop: "static", size: "sm" });
        var promise = ref.result;
        promise.then((res) => {
            this.passwordSave();
        }, (res) => {
            this.passwordCancel();
        });
        promise.catch((err) => {
            this.passwordCancel();
        });
    }

    public passwordSave() {
        this.authService.tryLogin(this.password)
    }

    public passwordCancel() {
    }

    userSelected(value) {
        if (this.inDbInitialisationProcess) return
        if (!value) value = ''
        if (value.id) {
            this.authService.setUserId(value.id, value.equipeNotNeeded);
        }
        else {
            this.navigateToHome()
            this.authService.setUserId('', false);
        }
    }

    equipeSelected(value) {
        if (this.inDbInitialisationProcess) return
        if (!value) value = ''
        if (value.id) {
            this.authService.setEquipeId(value.id);
        }
        else {
            this.navigateToHome()
            this.authService.setEquipeId('');
        }
    }

    laboSelected(value) {
        if (!value) return
        this.inDbInitialisationProcess= true
        this.authService.setUserId('', false)
        this.dataStore.setLaboName(value.id)
    }

    title = 'Krino';

    changeLabo() {
        this.authorizationStatusInfo.logout()        
        this.dataStore.setLaboName(undefined)
    }

    autocompleListFormatter = (data: any): SafeHtml => {
        let html = `<span>${data.value}</span>`;
        return this._sanitizer.bypassSecurityTrustHtml(html);
    };

    navigateToBasket() {
        let link = ['/basket'];
        this.router.navigate(link);
    }

    navigateToHome() {
        let link = ['/home'];
        this.router.navigate(link);
    }


    sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }


    disableScrolling() {
        this.showScrollText = false
        this.sleep(30 * 60 * 1000).then(() => {
            this.showScrollText = true
        });
    }


}

