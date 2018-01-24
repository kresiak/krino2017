import { Injectable, Inject } from '@angular/core'
import { AuthenticationStatusInfo, AuthService } from './auth.service'
import { NotificationService } from './notification.service'
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router'
import { DataStore } from 'gg-basic-data-services'
import { Observable, Subscription, ReplaySubject } from 'rxjs/Rx'
import { TranslationLoaderService } from 'gg-translation'

@Injectable()
export class MenuService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(AuthService) private authService: AuthService, private router: Router
        , @Inject(NotificationService) private notificationService: NotificationService, private translationLoaderService: TranslationLoaderService) {

    }

    private menu: any[]
    private menuSubject: ReplaySubject<any[]> = new ReplaySubject(1)

    private emitCurrentMenu() {
        this.menuSubject.next(this.menu)
    }

    private loginSideEffectObservable(): Observable<any> {
        return Observable.combineLatest(this.authService.getStatusObservable(), this.dataStore.getLaboNameObservable(), (statusInfo, laboName) => {
            return {
                statusInfo: statusInfo,
                laboName: laboName
            }
        }).do(info => {
            this.initMenuBasedOnLoginUser(info.statusInfo, info.laboName)
            this.emitCurrentMenu()
        }).switchMap(info => {
            return Observable.combineLatest(this.notificationService.getLmWarningMessages().map(messagesObj => messagesObj.finishingOtps.length).distinctUntilChanged(),
                this.notificationService.getNbPrivateMessages(info.statusInfo.currentUserId).distinctUntilChanged(),
                this.translationLoaderService.getTranslationWord('DASHBOARD.ALERTS.EXPIRING OTPS'), this.translationLoaderService.getTranslationWord('DASHBOARD.ALERTS.PRIVATE MSGS'),
                (nbFinishingOtp, nbPrivateMessages, msgExpiringOtps, msgPrivateMessages) => {
                    return {
                        nbFinishingOtp: nbFinishingOtp,
                        nbPrivateMessages: nbPrivateMessages,
                        msgExpiringOtps: msgExpiringOtps,
                        msgPrivateMessages: msgPrivateMessages,
                        isAdmin: info.statusInfo.isAdministrator()
                    }
                })
        }).do(data => {
            var needsHighlight: boolean = ((data.isAdmin ? data.nbFinishingOtp : 0) + data.nbPrivateMessages) > 0

            var item = this.menu.filter(menuitem => menuitem.route === '/dashboard')[0]
            if (item) {
                item.isAttractAttentionMode = needsHighlight
                item.attractAttentionModeText = needsHighlight ? ((data.isAdmin && data.nbFinishingOtp > 0) ? data.msgExpiringOtps : '') + (data.nbPrivateMessages > 0 ? data.msgPrivateMessages : '') : ''
                this.emitCurrentMenu()
            }
        })
    }

    initializeMenus() {
        Observable.combineLatest(this.router.events.filter(event => event instanceof NavigationEnd), this.loginSideEffectObservable(),
            ((event, nothing) => {
                this.updateMenuBasedOnUrl(event)
                this.emitCurrentMenu()
            }))
            .subscribe(() => { });
    }

    getMenuObservable(): Observable<any[]> {
        return this.menuSubject
    }

    private updateMenuBasedOnUrl(event) {
        var e = <NavigationEnd>event;
        var r = e.urlAfterRedirects === '/' ? '/home' : e.urlAfterRedirects;
        try {
            this.activateMenu(this.menu.filter(menuitem => menuitem.route === r || r.startsWith(menuitem.route + '?'))[0]);
            if (this.menu.filter(m => m.active).length === 0) {
                ['order', 'otp', 'equipe', 'product', 'user', 'category', 'supplier', 'sap'].filter(objType => r.startsWith('/' + objType + '/')).forEach(objType => {
                    this.menu.push({
                        title: 'Detail ' + objType,
                        active: true,
                        temporary: true
                    })
                })
            }
        }
        catch (e) {
        }
        finally {

        }
    }

    private initMenuBasedOnLoginUser(statusInfo: AuthenticationStatusInfo, laboName: string) {
        var isLoggedIn: boolean = statusInfo && statusInfo.isLoggedIn
        this.menu = [
            {
                route: '/home',
                title: 'Homex',
                titleKey: 'MENU.HOME',
                active: false
            },
            {
                route: '/dashboard',
                title: 'Dashboard',
                titleKey: 'MENU.DASHBOARD',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/mykrino',
                title: 'My Krino',
                titleKey: 'MENU.MYKRINO',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/orders',
                title: 'Orders',
                titleKey: 'MENU.ORDERS',
                active: false,
                hide: !laboName
            },
            {
                route: '/products',
                title: 'Products',
                titleKey: 'MENU.PRODUCTS',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/suppliers',
                title: 'Suppliers',
                titleKey: 'MENU.SUPPLIERS',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/stock',
                title: 'Stock',
                titleKey: 'MENU.STOCK',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/categories',
                title: 'Categories',
                titleKey: 'MENU.CATEGORIES',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/equipes',
                title: 'Equipes',
                titleKey: 'MENU.EQUIPES',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/users',
                title: 'Users',
                titleKey: 'MENU.USERS',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/otps',
                title: 'Otps',
                titleKey: 'MENU.OTPS',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/saps',
                title: 'Sap',
                titleKey: 'MENU.SAP',
                active: false,
                hide: !isLoggedIn || statusInfo.isGroupOrdersUser()
            },
            {
                route: '/admin',
                title: 'Administration',
                titleKey: 'MENU.ADMIN',
                active: false,
                hide: !isLoggedIn || !statusInfo.isAdministrator()
            },
            {
                route: '/reception',
                title: 'Reception',
                titleKey: 'MENU.RECEPTION',
                active: false,
                hide: statusInfo.isGroupOrdersUser()
            },
            {
                route: '/communication',
                title: 'Communication',
                titleKey: 'MENU.COMMUNICATION',
                active: false,
                hide: !isLoggedIn
            },
            {
                route: '/platform',
                title: 'Platform',
                titleKey: 'MENU.PLATFORM',
                active: false,
                hide: !isLoggedIn || !statusInfo.isPlatformAdminstrator()
            },
            {
                route: '/public',
                title: 'Participate',
                titleKey: 'MENU.PARTICIPATE',
                active: false
            },
            {
                route: '/xenia',
                title: 'Xenia',
                titleKey: 'MENU.XENIA',
                active: false
            }
        ];
        this.menu = this.menu.filter(item => !item.hide)
    }

    private activateMenu(menuItem) {
        this.menu = this.menu.filter(item => !item.temporary)

        if (menuItem && menuItem.isAttractAttentionMode) {
            delete menuItem.isAttractAttentionMode
            delete menuItem.attractAttentionModeText
        }
        this.menu.forEach(element => {
            element.active = false;
        });
        if (menuItem) menuItem.active = true;
    }


}


