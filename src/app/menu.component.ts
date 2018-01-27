import { Component, OnInit, Input } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router'
import {TranslateService} from '@ngx-translate/core'


@Component(
    {
        selector: 'gg-menus',
        templateUrl: './menu.component.html'
    }
)
export class MenuComponent implements OnInit {

    constructor( public translate: TranslateService, private router: Router) {
    }

    public menu: any[]
    public isPageRunning: boolean = true
    
    @Input() menuObservable: Observable<any>
    @Input() extraRoutes: string[]= []
    @Input() translateKeyRoot: string= 'GENERAL'

    ngOnInit(): void {

        Observable.combineLatest(this.router.events.filter(event => event instanceof NavigationEnd), this.menuObservable.takeWhile(() => this.isPageRunning),
        ((event, menu) => {
            this.menu = menu
            this.updateMenuBasedOnUrl(event)
        }))
        .subscribe(() => { });
        
    }

    ngOnDestroy(): void {
    }

    private updateMenuBasedOnUrl(event) {
        var e = <NavigationEnd>event;
        var r = e.urlAfterRedirects === '/' ? '/home' : e.urlAfterRedirects;
        try {
            this.activateMenu(this.menu.filter(menuitem => menuitem.route === r || r.startsWith(menuitem.route + '?'))[0]);
            if (this.menu.filter(m => m.active).length === 0) {
                this.extraRoutes.filter(objType => r.startsWith('/' + objType + '/')).forEach(objType => {
                    this.menu.push({
                        route: objType,
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



    public activateMenu(menuItem) {
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