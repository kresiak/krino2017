import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'
import { ActivatedRoute, Params, Router, NavigationExtras } from '@angular/router'
import { Observable } from 'rxjs/Rx'
import { DataStore } from 'gg-basic-data-services'
import { ProductService } from './../Shared/Services/product.service';
import { OrderService } from './../Shared/Services/order.service';
import { EquipeService } from '../Shared/Services/equipe.service';
import { OtpService } from '../Shared/Services/otp.service'
import { UserService } from './../Shared/Services/user.service'
import { NavigationService } from './../Shared/Services/navigation.service'
import { SapService } from './../Shared/Services/sap.service'
import { ConfigService } from 'gg-basic-data-services'
import { SelectableData } from 'gg-basic-code'
import { ChartService } from './../Shared/Services/chart.service'
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment"
import { utilsComparators as comparatorsUtils } from 'gg-search-handle-data'
import { utilsDates as dateUtils } from 'gg-basic-code'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import { FormItemStructure, FormItemType } from 'gg-ui'


@Component(
    {
        //moduleId: module.id,
        selector: 'gg-otp-detail',
        templateUrl: './otp-detail.component.html'
    }
)
export class OtpDetailComponent implements OnInit {
    constructor(private dataStore: DataStore, private productService: ProductService, private orderService: OrderService, private userService: UserService,
        private chartService: ChartService, private navigationService: NavigationService, private router: Router, private authService: AuthService, private sapService: SapService,
        private otpService: OtpService, private equipeService: EquipeService, private configService: ConfigService) {
    }
    public pieSpentChart;

    @Input() otpObservable: Observable<any>;
    @Input() state;
    @Input() path: string
    @Input() isRoot: boolean = false
    @Output() stateChanged = new EventEmitter()

    public stateInit() {
        if (!this.state) this.state = {};
        if (!this.state.selectedTabId) this.state.selectedTabId = '';
    }

    public equipeListObservable
    public otp;
    public sapIdList: any[]
    public ordersObservable;
    public selectableCategoriesObservable: Observable<any>;
    public selectableClassificationsObservable: Observable<any>;

    public selectedCategoryIdsObservable: Observable<any>;
    public selectedClassificationIdsObservable: Observable<any>;
    public anyOrder: boolean;
    public authorizationStatusInfo: AuthenticationStatusInfo;

    public selectableUsers: Observable<SelectableData[]>;
    public selectedUserIdsObservable: Observable<any>;

    public uploadUrl: string
    public filePath: string

    public formStructure: FormItemStructure[] = []

    ngOnInit(): void {
        this.uploadUrl = this.dataStore.getUploadUrl()
        this.filePath = this.dataStore.getPictureUrlBase()

        this.stateInit();
        this.selectableCategoriesObservable = this.productService.getSelectableCategories();
        this.selectableClassificationsObservable = this.otpService.getSelectableClassifications();
        this.selectableUsers = this.authService.getSelectableUsers(true);


        this.selectedCategoryIdsObservable = this.otpObservable.map(otp => (otp && otp.data) ? otp.data.categoryIds : []);
        this.selectedClassificationIdsObservable = this.otpObservable.map(otp => (otp && otp.data) ? otp.data.classificationIds : []);

        this.otpObservable.takeWhile(()=> this.isPageRunning).switchMap(otp => this.orderService.hasOtpAnyOrder(otp.data._id).takeWhile(()=> this.isPageRunning))
                .subscribe(anyOrder => this.anyOrder = anyOrder);

        this.otpObservable.takeWhile(()=> this.isPageRunning).do(otp => {
            if (!otp) return
            if (!comparatorsUtils.softCopy(this.otp, otp))
                this.otp = otp;
            if (otp) {
                this.selectedUserIdsObservable = Observable.from([this.otp.data.userIds]);
                this.ordersObservable = this.orderService.getAnnotedOrdersByOtp(otp.data._id);
                this.pieSpentChart = this.chartService.getSpentPieData(this.otp.annotation.amountSpent / this.otp.annotation.budget * 100);
            }
        }).switchMap(otp => this.sapService.getSapItemsByOtpObservable(otp.data.name).takeWhile(()=> this.isPageRunning)).subscribe(lst => {
            this.sapIdList = lst})

        this.authService.getStatusObservable().takeWhile(()=> this.isPageRunning).subscribe(statusInfo => {
            this.authorizationStatusInfo = statusInfo
        });

        this.equipeListObservable = this.equipeService.getEquipesForAutocomplete()

        this.formStructure.push(new FormItemStructure('budgetAnnual', 'OTP.LABEL.BUDGET', FormItemType.InputMoney, { isRequired: true }))
        this.formStructure.push(new FormItemStructure('datStartAnnual', 'OTP.LABEL.FROM', FormItemType.GigaDate))
        this.formStructure.push(new FormItemStructure('datEndAnnual', 'OTP.LABEL.TO', FormItemType.GigaDate))

    }

    SaveNewBudget(data) {
        if (!this.otp.data.budgetPeriods) this.otp.data.budgetPeriods = []

        this.otp.data.budgetPeriods.push({
            budget: data.budgetAnnual,
            datStart: data.datStartAnnual || dateUtils.nowFormated(),
            datEnd: data.datEndAnnual || dateUtils.nowFormated()
        })
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data).first().subscribe(res => {
            data.setSuccess('OK')
        });
    }

    isPageRunning: boolean= true

    ngOnDestroy(): void {
        this.isPageRunning = false
    }

    categorySelectionChanged(selectedIds: string[]) {
        this.otp.data.categoryIds = selectedIds;
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);
    }

    categoryHasBeenAdded(newCategory: string) {
        this.productService.createCategory(newCategory);
    }

    setDashlet() {
        this.userService.createOtpDashletForCurrentUser(this.otp.data._id);
    }

    removeDashlet(dashletId) {
        if (dashletId)
            this.userService.removeDashletForCurrentUser(dashletId);
    }

    public beforeTabChange($event: NgbTabChangeEvent) {
        if ($event.nextId === 'tabMax') {
            $event.preventDefault();
            this.navigationService.maximizeOrUnmaximize('/otp', this.otp.data._id, this.path, this.isRoot)
            return
        }
        if ($event.nextId === 'gotoTop') {
            $event.preventDefault();
            this.navigationService.jumpToTop()
            return
        }

        this.state.selectedTabId = $event.nextId;
        this.stateChanged.next(this.state);
    };

    public childOrdersStateChanged($event) {
        this.state.Orders = $event;
        this.stateChanged.next(this.state);
    }

    public childSapsStateChanged($event) {
        this.state.Saps = $event;
        this.stateChanged.next(this.state);
    }

    classificationHasBeenAdded(newCategory) {
        this.dataStore.addData('otp.product.classifications', { 'name': newCategory });
    }

    propertyChanged(propName, val) {
        this.otp.data[propName] = val
        this.dataStore.updateData('otps', this.otp.data._id, this.otp.data);        
    }

}