import { Injectable, Inject } from '@angular/core'
import { DataStore } from 'gg-basic-data-services'
import { TeambuilderService } from './teambuilder.service'
import { Observable, BehaviorSubject, ReplaySubject, Subscription } from 'rxjs/Rx'
import { SelectableData } from './../../Shared/Classes/selectable-data'
import { StatusInfoInterface } from './../../ui/login/statusInfo.inteface'

// helper class
// ============



export class SignedInStatusInfo implements StatusInfoInterface {
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
        return this.annotatedUser && (this.annotatedUser.data.isAdmin || this.annotatedUser.data._id==='59fd991b1fdf3e542868c078' )
    }

    isBossOf(person) {
        if (!this.annotatedUser) return false
        return (person && person.annotation.team && this.annotatedUser.annotation.team && this.annotatedUser.annotation.team._id === person.annotation.team._id && this.annotatedUser.annotation.isPi) || 
                    (person && person.annotation.unit && this.currentUserId === person.annotation.unit.directorId)
    }

    hasRightsOnPerson(person) {
        return this.annotatedUser && person && this.isAdministrator() || this.isProgrammer() || this.isBossOf(person) || this.currentUserId === person.data._id
    }

    isMyself(person) {
        return this.annotatedUser && person && this.currentUserId === person.data._id
    }

    isMyUnit(unit) {
        return  unit && this.annotatedUser && this.annotatedUser.annotation.isDirector && this.annotatedUser.annotation.unit && this.annotatedUser.annotation.unit._id === unit._id
    }

    isMyTeam(team) {
        return  team && this.annotatedUser && 
           ( (this.annotatedUser.annotation.isPi && this.annotatedUser.annotation.team && this.annotatedUser.annotation.team._id === team._id)  ||
           (this.annotatedUser.annotation.isDirector && this.annotatedUser.annotation.unit && this.annotatedUser.annotation.unit._id === team.thematicUnitId)
            )
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
export class AuthService {
    constructor( @Inject(DataStore) private dataStore: DataStore, @Inject(TeambuilderService) private teambuilderService: TeambuilderService) {
        this.emitCurrentAuthenticationStatus()
    }

    private authInfo: SignedInStatusInfo = new SignedInStatusInfo('', false)
    private authInfoSubject: ReplaySubject<SignedInStatusInfo> = new ReplaySubject(1)


    // Login/Logout services + helper
    // ==============================

    private emitCurrentAuthenticationStatus() {
        this.authInfoSubject.next(this.authInfo)
    }

    private LSUserKey: string = 'gigaTBUser'

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
            this.teambuilderService.getPersonsAnnotated().first().map(users => users.filter(user => user.data.email.toLowerCase()===email.toLowerCase())[0]).subscribe(user => {      //  && user.data.password===password
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

    getAnnotatedCurrentUser(): Observable<any> {
        return Observable.combineLatest(this.teambuilderService.getPersonsAnnotated(), this.getUserIdObservable(), (users, userId) => {
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