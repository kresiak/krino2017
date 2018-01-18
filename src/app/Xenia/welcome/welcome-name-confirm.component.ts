import { Component, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'

import { XeniaWelcomeService } from '../services/welcome.service'
import { DataStore } from '../../Shared/Services/data.service'


@Component(
    {
        templateUrl: './welcome-name-confirm.component.html'
    }
)
export class XeniaWelcomeNameConfirmComponent implements OnInit {
    public possibleUsers: any[]
    public selectedUserId: string
    public userAnswer: string= ''

    constructor(private welcomeService: XeniaWelcomeService, private dataStore: DataStore) { }

    ngOnInit(): void {
        var data = this.welcomeService.getData()
        this.selectedUserId = data.userId
        if (this.selectedUserId) this.userAnswer= this.selectedUserId === '-1' ? 'no' : 'yes'
        this.checkData()

        this.dataStore.getDataObservable('users.xenia').map(users => {
            return users.filter(u => u.name.toUpperCase() === (data.name || '').toUpperCase())
        }).takeWhile(() => this.isPageRunning).subscribe(res => {
            this.possibleUsers = res.map(u => {
                return {
                    data: u,
                    annotation: {
                        fullName: u.firstName + ' ' + u.name
                    }
                }
            })
            if (this.possibleUsers.length === 0) {
                this.welcomeService.nextEnable(() => {
                    this.welcomeService.setUserId(undefined)
                    this.welcomeService.navigateTo('email')
                })
            }
        })

    }

    public isPageRunning: boolean = true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    public checkData() {
        if (this.selectedUserId) {
            this.welcomeService.nextEnable(() => {
                this.welcomeService.setUserId(this.selectedUserId)
                this.welcomeService.navigateTo('email')
            })
        }
        else {
            this.welcomeService.nextDisable()
        }
    }

    setUserSelected(user) {
        this.selectedUserId = user.data._id
        this.userAnswer= 'yes'
        this.checkData()
    }

    setUserAnswer(answer) {
        this.userAnswer= answer
        if (answer === 'no') this.selectedUserId = '-1'
        if (answer === 'yes') this.selectedUserId = this.possibleUsers.length === 1 ? this.possibleUsers[0].data._id : ''
        this.checkData()
    }
}
