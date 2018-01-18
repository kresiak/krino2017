import { Injectable, Inject } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
/*import { SimplePageScrollService } from 'ng2-simple-page-scroll/ng2-simple-page-scroll';
*/

class NavStackElement {
    public lastPosition: number = -1
    public path: string

    constructor(lastPosition: number, path: string) {
        this.lastPosition = lastPosition
        this.path = path
    }
}

class Path2StateHelper {
    private path: string
    private tokens: string[]
    private separator = '|'

    constructor(path: string) {
        this.path = path
        this.tokens = this.path.split(this.separator)
    }

    private getCmd(): string {
        return this.tokens[0]
    }

    isForDetailView(): boolean {
        let cmd = this.getCmd()
        return cmd.charAt(cmd.length - 1).toUpperCase() !== 'S' && cmd.toUpperCase() !== 'DASHBOARD' && cmd.toUpperCase() !== 'MYKRINO' && cmd.toUpperCase() !== 'STOCK'
    }

    private generateState(arrPath: string[]): Object {
        let result = arrPath.reduce((acc, item) => {
            if (!acc.current) acc.current = acc.result
            let arr = item.split(':')
            let value = arr[1]
            switch (arr[0]) {
                case 'P':
                    acc.current.openPanelId = value.toString()
                    break
                case 'O':
                    acc.current.selectedTabId = 'tab' + value
                    break
            }
            acc.current[value] = {}
            acc.current = acc.current[value]

            return acc
        }, { result: {}, current: null })
        return result.result
    }

    getNavigationCommands(): string[] {
        let link = ['/' + this.getCmd()]
        if (this.isForDetailView()) link.push(this.tokens[1])
        return link
    }

    getState(): Object {
        let tokens: string[] = this.tokens.slice(this.isForDetailView() ? 2 : 1)
        return this.generateState(tokens)
    }
}

@Injectable()
export class NavigationService {

    private navStack: NavStackElement[] = []
    constructor(private router: Router, private route: ActivatedRoute) { }    //, private simplePageScrollService: SimplePageScrollService

    private addStackElement(lastPosition: number, path: string) {
        let element = new NavStackElement(lastPosition, path)
        this.navStack.push(element)
        return this.navStack.length - 1
    }

    maximizeOrUnmaximize(urlPath: string, id: string, currentPath: string, isRoot: boolean) {
        this.route.queryParams.first().subscribe(queryParams => {
            let lastPathId = +queryParams['lpid'];
            if (!isRoot) {
                let newPathId = this.addStackElement(lastPathId, currentPath)
                let link = [urlPath, id];
                let navigationExtras: NavigationExtras = {
                    queryParams: { 'lpid': newPathId }
                }
                this.router.navigate(link, navigationExtras);
            }
            else if (lastPathId || lastPathId === 0) {
                let stackElement = this.navStack[lastPathId];
                if (stackElement) {
                    let path = stackElement.path
                    let helper = new Path2StateHelper(path)

                    let navigationExtras: NavigationExtras = {
                        queryParams: {}
                    }
                    if (stackElement.lastPosition && stackElement.lastPosition != -1) {
                        navigationExtras.queryParams['lpid'] = stackElement.lastPosition
                    }
                    navigationExtras.queryParams['pid'] = lastPathId
                    this.router.navigate(helper.getNavigationCommands(), navigationExtras);
                }
            }
        })
    }

    getStateObservable(): Observable<Object> {
        return this.route.queryParams.first().map(queryParams => {
            let pathId = queryParams['pid'];
            if (pathId || pathId === 0) {
                let stackElement = this.navStack[pathId];
                if (!stackElement) return {}
                let path = stackElement.path
                let helper = new Path2StateHelper(path)
                return helper.getState()
            }
            else {
                return {}
            }
        })
    }

    jumpToOpenRootAccordionElement() {     // it would be better to jump to innerest open accordion but it doesn't work with simplePageScrollService
        this.route.queryParams.first().subscribe(queryParams => {
            let pathId = queryParams['pid'];
            if (pathId || pathId === 0) {
                let stackElement = this.navStack[pathId];
                if (!stackElement) return
                let path = stackElement.path
                let helper = new Path2StateHelper(path)
                if (helper.isForDetailView()) return
                var state = helper.getState()
                if (state['openPanelId']) {
                    //this.simplePageScrollService.scrollToElement('#' + state['openPanelId'], 0)  //in every list component, in the html, we put a  id 
                }
            }
        })
    }

    jumpToTop() {
        //this.simplePageScrollService.scrollToElement('#GGTOP', 0) 
    }
}