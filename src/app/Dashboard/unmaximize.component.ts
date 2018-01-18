import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'




@Component(
    {
        //moduleId: module.id,
        templateUrl: './unmaximize.component.html'
    }
)
export class UnMaximizeComponent implements OnInit {
    constructor(private route: ActivatedRoute) {
    }

    public state: Object
    public viewMode: string

    getState(arrPath: string[]) {
        let result= arrPath.reduce((acc, item) => {
            if (!acc.current) acc.current = acc.result
            let arr = item.split(':')
            let value = arr[1]
            switch (arr[0]) {
                case 'P':
                    acc.current.openPanelId = value
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

    initState(inputPath: string): Object {
        let tokens = inputPath.split('|')
        this.viewMode= tokens[0]
        switch (this.viewMode) {
            case 'equipes':
                return this.getState(tokens.slice(1))
            case 'otp':
            default:
        }
        return null
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(queryParams => {
            let inputPath = queryParams['path'];
            this.state = this.initState(inputPath)
        })
    }
}