import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { Observable, Subscription } from 'rxjs/Rx'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { StatusInfoInterface} from './statusInfo.inteface'


@Component(
    {
        selector: 'gg-signin-enter',
        templateUrl: './signin-enter.component.html'
    }
)
export class SigninEnterComponent implements OnInit {
    isPageRunning: boolean= true;
    public signinEnterForm: FormGroup
    authorizationStatusInfo: StatusInfoInterface;


    @Input() statusObservable: Observable<StatusInfoInterface>
    @Output() loginHasBeenTried= new EventEmitter()
    @Output() logout= new EventEmitter()


    constructor( private formBuilder: FormBuilder ) {
    }
    
    ngOnInit(): void {
        const emailRegex = /^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}$/i;

        this.signinEnterForm = this.formBuilder.group({
            emailAddress: ['', [Validators.required, Validators.pattern(emailRegex)]],
            password: ['']
            //password: ['', [Validators.required, Validators.minLength(2)]]
        });

        this.statusObservable.takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        })
        
    }

    login(formValue, isValid) {
        //this.authAnoynmousService.tryLogin(formValue.emailAddress, formValue.password)
        this.loginHasBeenTried.next({
            user: formValue.emailAddress,
            password: formValue.password
        })
    }
        
    resetSigninEnterForm() {
        this.signinEnterForm.reset();
    }
        
    ngOnDestroy(): void {
        this.isPageRunning = false
    }

}