import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'
import { AdminService } from './admin.service'
import { Observable, BehaviorSubject, ReplaySubject, Subscription } from 'rxjs/Rx'
import { SelectableData } from './../Classes/selectable-data'
import {TranslateService} from '@ngx-translate/core'
import { StatusInfoInterface } from './../../ui/login/statusInfo.inteface'

// helper class
// ============



export class AuthenticationStatusInfo implements StatusInfoInterface{
    public currentUserId: string = ''
    public currentEquipeId: string = ''
    public isLoggedIn: boolean = false
    public isLoginError: boolean = false
    public needsEquipeSelection: boolean = true
    private annotatedUser: any = null

    constructor(currentUserId: string, currentEquipeId, isLoggedIn) {
        this.currentUserId = currentUserId
        this.currentEquipeId = currentEquipeId
        this.isLoggedIn = isLoggedIn
    }

    setAnnotatedUser(user) {
        this.annotatedUser = user
    }


    isReadyForPassword() {
        return this.currentUserId !== '' && (this.currentEquipeId !== '' || !this.needsEquipeSelection) && !this.isLoggedIn
    }

    hasUserId() {
        return this.currentUserId != ''
    }

    hasEquipeId() {
        return this.currentEquipeId != '' && this.currentEquipeId != AuthService.noEquipeId
    }

    logout() {
        this.isLoggedIn = false
        this.annotatedUser = null
    }

    isAdministrator() {
        return this.annotatedUser && this.annotatedUser.data.isAdmin
    }

    isSuperAdministrator() {
        return this.annotatedUser && this.annotatedUser.data.isSuperAdmin
    }

    isOtpAwareUser() {
        return this.annotatedUser && this.annotatedUser.data.isOtpAware
    }

    isRightAdministrator(accessingPublicRessource: boolean= false) {
        return this.annotatedUser && ((accessingPublicRessource && this.annotatedUser.data.isSuperAdmin) || (!accessingPublicRessource && this.annotatedUser.data.isAdmin)) 
    }

    isThisUser(userId) {
        return this.isLoggedIn && this.currentUserId === userId
    }

    isReceptionist() {
        return this.annotatedUser && this.annotatedUser.data.isReceptionist
    }

    isLabManager() {
        return this.annotatedUser && this.annotatedUser.data.isLabManager
    }

    isProgrammer() {
        return this.annotatedUser && this.annotatedUser.data.isProgrammer
    }

    isPlatformAdminstrator() {
        return this.annotatedUser && this.annotatedUser.data.isPlatformAdmin
    }

    isPassiveUser() {
        return this.annotatedUser && this.annotatedUser.data.isPassiveUser
    }

    isGroupOrdersUser() {
        return this.annotatedUser && this.annotatedUser.annotation.isGroupOrdersUser
    }

    getCurrentUserName() {
        return this.annotatedUser && this.annotatedUser.annotation.fullName
    }
}

// Service
// =======

@Injectable()
export class AuthService {
    constructor( private dataStore: DataStore, private adminService: AdminService,  private translate: TranslateService) {
    }

    private authInfo: AuthenticationStatusInfo = new AuthenticationStatusInfo('', '', false)
    private authInfoSubject: ReplaySubject<AuthenticationStatusInfo> = new ReplaySubject(1)

    private currentUserSubscription: Subscription

    // Login/Logout services + helper
    // ==============================

    private emitCurrentAuthenticationStatus() {
        this.authInfoSubject.next(this.authInfo)
    }


    private prepareUserId(id: string, equipeNotNeeded: boolean) {
        this.authInfo.currentUserId = id
        this.authInfo.needsEquipeSelection= !equipeNotNeeded
        this.emitCurrentAuthenticationStatus()
    }

    private LSUserKey: string = 'krinoUser'
    private LSEquipeKey: string = 'krinoEquipe'

    initFromLocalStorage(): void {
        var equipeFromLS = localStorage.getItem(this.LSEquipeKey)
        if (equipeFromLS) {
            this.authInfo.currentEquipeId = equipeFromLS
        }
        var userFromLS = localStorage.getItem(this.LSUserKey)
        if (userFromLS) {
            this.prepareUserId(userFromLS, false)
        }
        else {
            this.prepareUserId('', false)
        }
        console.log("user from LS: " + userFromLS + " equipe: " + equipeFromLS)
    }


    setUserId(id: string, equipeNotNeeded: boolean): void {
        if (this.authInfo.currentUserId !== id) {
            this.authInfo.currentEquipeId = ''
            this.unsubscribeCurrentUser()
            this.authInfo.logout()
            if (!equipeNotNeeded) localStorage.setItem(this.LSUserKey, id)
            this.prepareUserId(id, equipeNotNeeded)
        }
    }

    setEquipeId(id: string): void {
        if (this.authInfo.currentEquipeId !== id) {
            this.authInfo.currentEquipeId = id
            this.authInfo.logout()
            localStorage.setItem(this.LSEquipeKey, id)
            this.emitCurrentAuthenticationStatus()
        }
    }

    private setLoggedIn() {
        this.authInfo.isLoggedIn = true
        this.emitCurrentAuthenticationStatus()
    }

    private unsubscribeCurrentUser() {
        if (this.currentUserSubscription && !this.currentUserSubscription.closed) this.currentUserSubscription.unsubscribe()
    }

    setLoggedOut() {
        this.unsubscribeCurrentUser()
        this.authInfo.isLoggedIn = false
        this.emitCurrentAuthenticationStatus()        
    }

    tryLogin(password: string) {
        this.authInfo.isLoginError = false
        this.unsubscribeCurrentUser()
        this.currentUserSubscription= this.getAnnotatedCurrentUserDisturbLess().subscribe(user => {
            if (user && ((!user.data.password && user.data.password != '') || user.data.password === password)) {
                this.authInfo.setAnnotatedUser(user)
                this.setLoggedIn()
            }
            else {
                if (user) this.authInfo.isLoginError = true
                this.setLoggedOut()
            }
        })
    }



    // helper functions for general public services
    // ============================================

    public readonly systemGroupUserId: string = 'SystemGroupUser'


    private createGroupingUser(password: string) {
        return {
            data: {
                _id: this.systemGroupUserId,
                password: password
            },
            annotation: {
                fullName: 'System: Group Orders',
                equipes: [],
                isSystem: true,
                equipeNotNeeded: true,
                isGroupOrdersUser: true
            }
        }
    }


    private createAnnotatedUser(user, equipes, labo) {
        if (!user) return null;
        let filteredEquipes = equipes.filter(equipe => equipe.userIds && equipe.userIds.includes(user._id));
        return {
            data: user,
            annotation: {
                fullName: user.firstName + ' ' + user.name,
                isSecrExec: labo && labo.data.secrExecIds && labo.data.secrExecIds.includes(user._id),
                equipesLeading: equipes.filter(eq => eq.managerIds && eq.managerIds.includes(user._id)).map(eq => eq._id),
                equipes: filteredEquipes,
                equipesTxt: (filteredEquipes && filteredEquipes.length > 0) ? filteredEquipes.map(eq => eq.name).reduce((a, b) => a + ', ' + b) : ''
            }
        };
    }

    private getAnnotatedUsersLight(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('users.krino'),
            this.dataStore.getDataObservable('equipes'),
            this.adminService.getLabo(),
            (users, equipes, labo) => {
                var list: any[] = users.map(user => this.createAnnotatedUser(user, equipes, labo)).sort((a, b) => { return a.annotation.fullName.toUpperCase() < b.annotation.fullName.toUpperCase() ? -1 : 1; });
                list.push(this.createGroupingUser(labo.data.passwordGroupOrdersUser))
                return list
            });
    }

    public getUserSimpleListObservable() {
        return this.getAnnotatedUsersLight().map(users => users.filter(user => !user.data.isBlocked).map(user => {
            return {
                id: user.data._id,
                value: user.annotation.fullName,
                equipeNotNeeded: user.annotation.equipeNotNeeded
            }
        }))
    }

    public static readonly noEquipeId: string = 'NoEquipeEntry'

    public getPossibleEquipeSimpleListObservable(authorizationStatusInfo: AuthenticationStatusInfo): Observable<any> {
        var userId = authorizationStatusInfo.currentUserId
        var isAdmin:boolean= false
        return this.getAnnotatedUsersLight().map(users => users.filter(user => user.data._id === userId)[0]).do(user => {isAdmin= (user && user.data && user.data.isAdmin)})
            .map(user => !user ? undefined : user.annotation.equipes.sort((a, b) => { return a.name < b.name ? -1 : 1; }))
            .map(equipes => {
                var list = (equipes || []).map(eq => {
                    return {
                        id: eq._id,
                        value: eq.name
                    }
                })

                if (isAdmin) {
                    list.push({
                        id: AuthService.noEquipeId,
                        value: 'Sans équipe'

                    })
                }

                return list
            })
    }


    // General services: about users, equipes, current user
    // =====================================================

    getAnnotatedUsers(): Observable<any> {
        return Observable.combineLatest(this.getAnnotatedUsersLight(), this.getUserIdObservable(), (annotatedUsers: any[], currentUserId) => {
            annotatedUsers.forEach(user => {
                user.annotation.isCurrentUser = user.data._id === currentUserId
            })
            return annotatedUsers
        })
    }

    getAnnotatedUsersHashmap(): Observable<any> {
        return this.getAnnotatedUsers().map(users => users.reduce((map, p) => {
            map.set(p.data._id, p)
            return map
        }, new Map()))

    }


    getAnnotatedUsersByEquipeId(equipeId: string): Observable<any> {
        return this.getAnnotatedUsers().map(annotUsers => {
            return annotUsers.filter(annotUser => annotUser.annotation && annotUser.annotation.equipes && annotUser.annotation.equipes.map(eq => eq._id).includes(equipeId));
        })
    }

    getAnnotatedUserById(id: string): Observable<any> {
        return this.getAnnotatedUsers().map(users => users.filter(s => {
            return s.data._id === id
        })[0]);
    }

    getAnnotatedAdminUsers(): Observable<any> {
        return this.getAnnotatedUsers().map(users => users.filter(s => {
            return s.data.isAdmin
        }));
    }


    getSelectableUsers(keepBlocked: boolean = false): Observable<SelectableData[]> {
        return this.getAnnotatedUsers().map(annotatedUsers => {
            return annotatedUsers.sort((user1, user2) => { return user1.annotation.fullName < user2.annotation.fullName ? -1 : 1; }).
                filter(user => keepBlocked || !user.data.isBlocked).
                map(user => new SelectableData(user.data._id, user.annotation.fullName))
        })
    }

    getAnnotatedCurrentUser(): Observable<any> {
        return this.getAnnotatedUsers().map(users => users.filter(u => u.annotation.isCurrentUser)[0])
    }

    private getAnnotatedCurrentUserDisturbLess(): Observable<any> {     // use first in this.getUserIdObservable().first() to avoid infinite circle and to avoid to be siturbed for nothing
        return Observable.combineLatest(this.getAnnotatedUsersLight(), this.getUserIdObservable().first(), (annotatedUsers: any[], currentUserId) => {
            annotatedUsers.forEach(user => {
                user.annotation.isCurrentUser = user.data._id === currentUserId
            })
            return annotatedUsers
        }).map(users => users.filter(u => u.annotation.isCurrentUser)[0])
    }


    getUserId(): string {
        return this.authInfo.currentUserId;
    }

    getEquipeId(): string {
        return this.authInfo.currentEquipeId;
    }


    // Services for getting the observables to track login changes
    // ===========================================================

    getUserIdObservable(): Observable<any> {
        return this.authInfoSubject.map(authInfo => authInfo.currentUserId);
    }

    getEquipeIdObservable(): Observable<any> {
        return this.authInfoSubject.map(authInfo => authInfo.currentEquipeId);
    }

    getStatusObservable(): Observable<AuthenticationStatusInfo> {
        return this.authInfoSubject
    }

    getGroupOrdersUserIdObservable(): Observable<any> {
        return Observable.from([this.systemGroupUserId]);
    }

    isUserGroupOrderUser(userId): boolean {
        return userId === this.systemGroupUserId
    }

    isCurrentUserGroupOrderUser(): boolean {
        return this.authInfo.currentUserId === this.systemGroupUserId
    }

}