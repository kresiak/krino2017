import { Component, Input, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx'

import { XeniaWelcomeService } from '../services/welcome.service'

@Component(
    {
        templateUrl: './welcome-email.component.html'
    }
)
export class XeniaWelcomeEmailComponent implements OnInit {
    constructor(private welcomeService: XeniaWelcomeService) { }

    public userAnswer: string= ''
    public email2: string

    ngOnInit(): void {
        var data = this.welcomeService.getData()
        this.email2= data.email2
        if (this.email2) this.userAnswer= this.email2 === '-1' ? 'no' : 'yes'
        if (this.email2 === '-1') this.email2=''
        this.checkData()
    }

    public isPageRunning: boolean= true

    ngOnDestroy(): void {
        this.isPageRunning= false
    }

    public checkData() {
        if ((this.userAnswer === 'yes' && this.email2) || this.userAnswer === 'no') {
            this.welcomeService.nextEnable(() => {
                this.welcomeService.setEmail(this.userAnswer === 'no' ? '-1' : this.email2)
                this.welcomeService.navigateTo('pi')
            })
        }
        else {
            this.welcomeService.nextDisable()
        }
    }

    setUserAnswer(answer) {
        this.userAnswer= answer
        if (answer==='no') this.email2=''
        this.checkData()
    }

    mailChanged(mail) {
        this.email2= mail
        this.checkData()
    }
}
