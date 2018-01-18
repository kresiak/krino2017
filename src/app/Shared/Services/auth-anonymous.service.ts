import { Injectable, Inject } from '@angular/core'
import { DataStore } from './data.service'
import { Observable, BehaviorSubject, ReplaySubject, Subscription } from 'rxjs/Rx'
import { SelectableData } from './../Classes/selectable-data'

// helper class
// ============



export class SignedInStatusInfo {
    public currentUserId: string = ''
    public isLoggedIn: boolean = false
    public isLoginError: boolean = false
    private annotatedUser: any = null

    constructor(currentUserId: string, isLoggedIn) {
        this.currentUserId = currentUserId
        this.isLoggedIn = isLoggedIn
    }

    setAnnotatedUser(user) {
        this.annotatedUser = user
    }

    hasUserId() {
        return this.currentUserId != ''
    }

    logout() {
        this.isLoggedIn = false
        this.annotatedUser = null
    }

    isAdministrator() {
        return this.annotatedUser && this.annotatedUser.data.isAdmin
    }

    isProgrammer() {
        return this.annotatedUser && this.annotatedUser.data.isProgrammer
    }

    getCurrentUserName() {
        return this.annotatedUser && this.annotatedUser.annotation.fullName
    }
}

// Service
// =======

@Injectable()
export class AuthAnoynmousService {
    constructor( @Inject(DataStore) private dataStore: DataStore) {
        this.emitCurrentAuthenticationStatus()
    }

    private authInfo: SignedInStatusInfo = new SignedInStatusInfo('', false)
    private authInfoSubject: ReplaySubject<SignedInStatusInfo> = new ReplaySubject(1)


    // Login/Logout services + helper
    // ==============================

    private emitCurrentAuthenticationStatus() {
        this.authInfoSubject.next(this.authInfo)
    }

    private LSUserKey: string = 'krinoAnonymousUser'

    getFromLocalStorage(): string {
        var userFromLS = localStorage.getItem(this.LSUserKey)
        return userFromLS || ''
    }

    setLoggedOut() {
        this.authInfo.isLoggedIn = false
        this.emitCurrentAuthenticationStatus()
    }

    tryLogin(email: string, password: string) {
        this.authInfo.isLoginError = false
        this.getAnnotatedUsersLight().first().map(users => users.filter(user => user.data.email===email && user.data.password===password)[0]).subscribe(user => {
            if (user) {
                localStorage.setItem(this.LSUserKey, email.trim())
                this.authInfo.logout()
                this.authInfo.currentUserId = user.data._id
                this.authInfo.setAnnotatedUser(user)
                this.authInfo.isLoggedIn = true
                this.emitCurrentAuthenticationStatus()                
            }
            else {
                this.authInfo.isLoginError = true
                this.emitCurrentAuthenticationStatus()
            }
        })
    }



    // helper functions for general public services
    // ============================================

    private createAnnotatedUser(user) {
        if (!user) return null;
        return {
            data: user,
            annotation: {
                fullName: user.firstName + ' ' + user.name
            }
        };
    }

    private getAnnotatedUsersLight(): Observable<any> {
        return Observable.combineLatest(
            this.dataStore.getDataObservable('users.public'),
            (users) => {
                var list: any[] = users.map(user => this.createAnnotatedUser(user)).sort((a, b) => { return a.annotation.fullName.toUpperCase() < b.annotation.fullName.toUpperCase() ? -1 : 1; });
                return list
            });
    }

    public getUserSimpleListObservable() {
        return this.getAnnotatedUsersLight().map(users => users.filter(user => !user.data.isBlocked).map(user => {
            return {
                id: user.data._id,
                value: user.annotation.fullName
            }
        }))
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
        return Observable.combineLatest(this.getAnnotatedUsers(), this.getUserIdObservable(), (users, userId) => {
            let usersFiltered = users.filter(user => user.data._id === userId);
            return (!usersFiltered || usersFiltered.length === 0) ? null : usersFiltered[0];
        });
    }

    getUserId(): string {
        return this.authInfo.currentUserId;
    }


    // Services for getting the observables to track login changes
    // ===========================================================

    getUserIdObservable(): Observable<any> {
        return this.authInfoSubject.map(authInfo => authInfo.currentUserId);
    }

    getStatusObservable(): Observable<SignedInStatusInfo> {
        return this.authInfoSubject
    }

}