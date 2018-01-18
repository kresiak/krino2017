import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
/*import { ChartistModule, ChartistComponent } from 'angular2-chartist';*/
import { Ng2AutoCompleteModule } from 'ng2-auto-complete';


/*import { Ng2SimplePageScrollModule } from 'ng2-simple-page-scroll/ng2-simple-page-scroll';*/

import { BasicServicesModule } from './Shared/Services/modules/basic.services.module'
import { BasicDataServicesModule } from 'gg-basic-data-services'

import { PlatformModule } from './Platforms/modules/platform.module'

import { UiModule } from './ui/modules/ui.module'

import { ProductsModule } from './products/modules/products.module'

import { OrdersModule } from './Orders/modules/orders.module'

import { CommentsModule } from './Comments/modules/comments.module'

import { XeniaModule } from './Xenia/modules/xenia.module'

import { XeniaMainComponent } from './Xenia/xenia-main.component'
import { XeniaWelcomeMainComponent } from './Xenia/xenia-welcome-main.component'
import { XeniaWelcomeIntroComponent } from './Xenia/welcome/welcome-intro.component'
import { XeniaWelcomeNameComponent } from './Xenia/welcome/welcome-name.component'
import { XeniaWelcomeNameConfirmComponent } from './Xenia/welcome/welcome-name-confirm.component'
import { XeniaWelcomeEmailComponent } from './Xenia/welcome/welcome-email.component'
import { XeniaWelcomePiComponent } from './Xenia/welcome/welcome-pi.component'
import { XeniaWelcomeFinalComponent } from './Xenia/welcome/welcome-final.component'
import { GigaPersonsSelectionComponent } from './Xenia/TeamBuilder/giga-persons-selection.component'
import { OrganiGigaMain } from './Xenia/TeamBuilder/organi.giga-main.component'

import { TasksHeadComponent } from './Xenia/TeamBuilder/tasks.head.component'
import { TasksTrudComponent } from './Xenia/TeamBuilder/tasks.trud.component'
import { TasksPiComponent } from './Xenia/TeamBuilder/tasks.pi.component'


import { AppComponent } from './app.component'
import { HomeComponent } from './home.component'

import { AdminMainComponent } from './Admin/admin-main.component'
import { AdminWebShoppingComponent } from './Admin/Webshopping/component'
import { AdminAK } from './Admin/AK/component'
import { AdminLabo } from './Admin/Laboratory/component'
import { LaboratoryEnterComponent } from './Admin/Laboratory/laboratory-enter.component'
import { CurrencyEnterComponent } from './Admin/currency-enter.component'
import { AdminWebShoppingVoucherRequestListComponent } from './Admin/Webshopping/voucher-request-list.component'
import { AdminWebShoppingVoucherRequestComponent } from './Admin/Webshopping/voucher-request.component'
import { MonitoringDetailComponent } from './Admin/Monitoring/monitoring-detail.component'

import { VoucherListComponent } from './Admin/Webshopping/voucher-list.component'
import { VoucherDetailComponent } from './Admin/Webshopping/voucher-detail.component'

import { SupplierInfoComponent } from './Suppliers/supplier-info.component';
import { SupplierListComponent } from './Suppliers/supplier-list.component';
import { SupplierListComponentRoutable } from './Suppliers/supplier-list.routable.component'
import { SupplierDetailComponent } from './Suppliers/supplier-detail.component';
import { SupplierDetailComponentRoutable } from './Suppliers/supplier-detail.routable.component';
import { SupplierEprocShoppingComponent } from './Suppliers/supplier-eproc-shopping';

import { ProductDetailComponentRoutable } from './products/product-detail.routable.component'
import { ProductListComponentRoutable } from './products/product-list.routable.component'
import { ProductGridBasketComponent } from './products/product-grid-basket.component';

import { SupplierSapDetailComponent } from './Suppliers/supplier-sap-detail.component'
import { SupplierSapListComponent } from './Suppliers/supplier-sap-list.component'

import { CategoryListComponent } from './Categories/category-list.component'
import { CategoryListComponentRoutable } from './Categories/category-list.routable.component'
import { CategoryDetailComponent } from './Categories/category-detail.component'

import { CategoryEnterComponent } from './Categories/category-enter.component'

import { CategoryDetailComponentRoutable } from './Categories/category-detail.routable.component'

import { OtpListComponent } from './Otps/otp-list.component';
import { OtpListComponentRoutable } from './Otps/otp-list.routable.component';
import { OtpDetailComponent } from './Otps/otp-detail.component';
import { OtpDetailComponentRoutable } from './Otps/otp-detail.routable.component';
import { OtpEnterComponent } from './Otps/otp-enter.component';
import { OtpSapByDateComponent } from './Otps/otp-sap-date.component';
import { OtpPeriodDetailComponent } from './Otps/otp-period-detail.component';
import { OtpCheckerComponent } from './Otps/otp-checker.component'
import { OtpCandidatesComponent } from './Otps/otp-candidates.component'
import { ClassificationListComponent } from './Otps/classification-list.component'
import { ClassificationsComponent } from './Otps/classifications.component'


import { PlatformMainComponent } from './Platforms/platform-main-component'

import { PublicMainComponent } from './Public/public-main-component'
import { MarketsMainComponent } from './Public/Markets/markets-main.component'
import { MarketsEnterComponent } from './Public/Markets/markets-enter.component'
import { RegisterEnterComponent } from './Public/Identification/register-enter.component'

import { UserListComponentRoutable } from './Users/user-list.routable.component'
import { UserListComponent } from './Users/user-list.component'
import { UserEnterComponent } from './Users/user-enter.component'
import { UserDetailComponent } from './Users/user-detail.component';
import { UserDetailComponentRoutable } from './Users/user-detail.routable.component';
import { UserInfoComponent } from './Users/user-info.component';

import { EquipeDetailComponent } from './Equipes/equipe-detail.component'
import { EquipeDetailComponentRoutable } from './Equipes/equipe-detail.routable.component'
import { EquipeListComponent } from './Equipes/equipe-list.component'
import { EquipeListComponentRoutable } from './Equipes/equipe-list.routable.component'
import { EquipeEnterComponent } from './Equipes/equipe-enter.component'
import { EquipeGroupEnterComponent } from './Equipes/equipe-group-enter.component'
import { EquipeGroupListComponent } from './Equipes/equipe-group-list.component'
import { EquipeGroupDetailComponent } from './Equipes/equipe-group-detail.component'
import { EquipeGiftEnterComponent } from './Equipes/equipe-gift-enter.component'
import { EquipeGiftGridComponent } from './Equipes/equipe-gift-grid.component'
import { EquipeBilanComponent } from './Equipes/equipe-bilan.component'
import { EquipeDebtDetailsComponent } from './Equipes/equipe-debt-details.component'


import { BasketRoutableComponent } from './Orders/basket.routable.component'
import { PreOrderComponent } from './Orders/pre-order.component'
import { OrderComponentRoutable } from './Orders/order-detail.routable.component'
import { OrderDetailComponent } from './Orders/order-detail.component'
import { OrderListComponent } from './Orders/order-list.component'
import { OrderListComponentRoutable } from './Orders/order-list.routable.component'
import { OrderFridgeListComponent } from './Orders/order-fridge-list.component'

import { SapComponentRoutable } from './Sap/sap-detail.routable.component'
import { SapDetailComponent } from './Sap/sap-detail.component'
import { SapSheetComponent } from './Sap/sap-sheet.component'
import { SapListComponentRoutable } from './Sap/sap-list.routable.component'
import { SapListComponent } from './Sap/sap-list.component'
import { SapListBySapIdsComponent } from './Sap/sap-list-by-sapids.component'


import { StockDetailComponent } from './Stock/stock-detail.component'
import { StockListComponent } from './Stock/stock-list.component'
import { StockComponentRoutable } from './Stock/stock.routable.component'
import { StockProductEnterComponent } from './Stock/stock-product-order.component'
import { StockOrderListComponent } from './Stock/stock-order-list.component'
import { StockOrderDetailComponent } from './Stock/stock-order-detail.component'

import { ReceptionDetailComponent } from './Reception/reception-detail.component'
import { CommunicationEnterComponent } from './Communication/communication-enter.component'

import { DashboardComponent } from './Dashboard/dashboard.component'
import { DashletComponent } from './Dashboard/dashlet.component'
import { MyKrinoComponent } from './Dashboard/mykrino.component'
import { UnMaximizeComponent } from './Dashboard/unmaximize.component'

import { NavigationService } from './Shared/Services/navigation.service';
import { SupplierService } from './Shared/Services/supplier.service'
import { OrderService } from './Shared/Services/order.service'
import { OtpService } from './Shared/Services/otp.service'
import { EquipeService } from './Shared/Services/equipe.service'
import { StockService } from './Shared/Services/stock.service'
import { BasketService } from './Shared/Services/basket.service'
import { NotificationService } from './Shared/Services/notification.service'
import { VoucherService } from './Shared/Services/voucher.service'
import { OtpChoiceService } from './Shared/Services/otp-choice.service'
import { UserService } from './Shared/Services/user.service'
import { SapService } from './Shared/Services/sap.service'
import { MenuService } from './Shared/Services/menu.service'
import { ChartService } from './Shared/Services/chart.service'
import { AuthAnoynmousService } from './Shared/Services/auth-anonymous.service'
import { TranslationLoaderService } from './Shared/Services/translation.loader.service'


import { RainbowDirective } from './Shared/Directives/test.directive'

import { TranslateModule, TranslateLoader, TranslateService  } from '@ngx-translate/core'
//import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { locale as english } from './locale/en'
import { locale as french } from './locale/fr'

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr, 'fr');  // https://angular.io/guide/i18n#i18n-pipes      //A5

@NgModule({
  imports: [
    UiModule, ProductsModule, CommentsModule, OrdersModule, XeniaModule,
    BasicServicesModule.forRoot(),
    BasicDataServicesModule.forRoot(),
    PlatformModule.forRoot(),
    //ChartistModule,
    BrowserModule,
    FormsModule, ReactiveFormsModule,
    HttpClientModule,
    Ng2AutoCompleteModule,
    NgbModule.forRoot(),
    //Ng2SimplePageScrollModule.forRoot(),    
    TranslateModule.forRoot(),
    RouterModule.forRoot([
      { path: "admin", component: AdminMainComponent },
      { path: "basket", component: BasketRoutableComponent },
      { path: "suppliers", component: SupplierListComponentRoutable },
      { path: "equipes", component: EquipeListComponentRoutable },
      { path: "orders", component: OrderListComponentRoutable },
      { path: "saps", component: SapListComponentRoutable },
      { path: "categories", component: CategoryListComponentRoutable },
      { path: "otps", component: OtpListComponentRoutable },
      { path: 'otp/:id', component: OtpDetailComponentRoutable },
      { path: 'supplier/:id', component: SupplierDetailComponentRoutable },
      { path: 'product/:id', component: ProductDetailComponentRoutable },
      { path: 'category/:id', component: CategoryDetailComponentRoutable },
      { path: 'equipe/:id', component: EquipeDetailComponentRoutable },
      { path: 'user/:id', component: UserDetailComponentRoutable },
      { path: 'users', component: UserListComponentRoutable },
      { path: "products", component: ProductListComponentRoutable },
      { path: "dashboard", component: DashboardComponent },
      { path: "mykrino", component: MyKrinoComponent },
      { path: "home", component: HomeComponent },
      { path: "stock", component: StockComponentRoutable },
      { path: "unmaximize", component: UnMaximizeComponent },
      { path: "", component: HomeComponent, pathMatch: 'full' },
      { path: 'preorder/:id', component: PreOrderComponent },
      { path: 'order/:id', component: OrderComponentRoutable },
      { path: 'sap/:id', component: SapComponentRoutable },
      { path: 'reception', component: ReceptionDetailComponent },
      { path: 'communication', component: CommunicationEnterComponent },
      { path: 'platform', component: PlatformMainComponent },
      { path: 'public', component: PublicMainComponent },
      { path: 'taskshead/:id', component: TasksHeadComponent },  
      { path: 'taskstrud/:id', component: TasksTrudComponent },      
      { path: 'taskspi/:id', component: TasksPiComponent },      
      { path: 'organiGiga', component: OrganiGigaMain },            
      {
        path: 'xenia',
        component: XeniaMainComponent,
        children: [
          {
            path: 'welcome',
            component: XeniaWelcomeMainComponent,
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'intro'
              },
              {
                path: 'intro',
                component: XeniaWelcomeIntroComponent
              },
              {
                path: 'name',
                component: XeniaWelcomeNameComponent
              },
              {
                path: 'nameConfirm',
                component: XeniaWelcomeNameConfirmComponent
              },
              {
                path: 'email',
                component: XeniaWelcomeEmailComponent
              },
              {
                path: 'pi',
                component: XeniaWelcomePiComponent
              },
              {
                path: 'final',
                component: XeniaWelcomeFinalComponent
              }
            ]
          },
          {
            path: 'teambuilder',
            component: GigaPersonsSelectionComponent
          }
        ]
      },
      { path: '**', redirectTo: '/home' }
    ])
  ],
  declarations: [AppComponent, HomeComponent,
    VoucherListComponent, VoucherDetailComponent, MonitoringDetailComponent,
    AdminMainComponent, AdminWebShoppingComponent, AdminWebShoppingVoucherRequestListComponent, AdminWebShoppingVoucherRequestComponent, AdminAK, AdminLabo,
    LaboratoryEnterComponent, CurrencyEnterComponent,
    SupplierListComponent, SupplierDetailComponent, SupplierListComponentRoutable, SupplierDetailComponentRoutable, SupplierInfoComponent, SupplierEprocShoppingComponent,
    ProductListComponentRoutable, ProductDetailComponentRoutable, ProductGridBasketComponent,
    OtpListComponent, OtpDetailComponent, OtpDetailComponentRoutable, OtpListComponentRoutable, OtpEnterComponent, OtpSapByDateComponent, OtpPeriodDetailComponent, OtpCheckerComponent, OtpCandidatesComponent, 
    ClassificationListComponent, ClassificationsComponent,

    CategoryListComponent, CategoryDetailComponent, CategoryListComponentRoutable, CategoryEnterComponent, CategoryDetailComponentRoutable,
    ReceptionDetailComponent, CommunicationEnterComponent,
    StockComponentRoutable, StockListComponent, StockProductEnterComponent, StockOrderListComponent, StockOrderDetailComponent, StockDetailComponent,
    DashboardComponent, DashletComponent, MyKrinoComponent, UnMaximizeComponent,
    UserEnterComponent, UserListComponentRoutable, UserListComponent, UserDetailComponent, UserDetailComponentRoutable, UserInfoComponent,
    EquipeDetailComponent, EquipeListComponent, EquipeListComponentRoutable, EquipeEnterComponent, EquipeDetailComponentRoutable, EquipeGroupEnterComponent, EquipeGroupListComponent, EquipeGroupDetailComponent, EquipeGiftEnterComponent,
    EquipeGiftGridComponent, EquipeBilanComponent, EquipeDebtDetailsComponent,
    PreOrderComponent, OrderComponentRoutable, BasketRoutableComponent, OrderListComponentRoutable, OrderFridgeListComponent,
    SapComponentRoutable, SapDetailComponent, SapSheetComponent, SapListComponentRoutable, SapListComponent, SapListBySapIdsComponent,

    SupplierSapDetailComponent, SupplierSapListComponent,
    PublicMainComponent, MarketsMainComponent, MarketsEnterComponent, RegisterEnterComponent,
    RainbowDirective,
  ],
  providers: [NavigationService, OtpChoiceService, SupplierService, OrderService, UserService, ChartService, MenuService,
    SapService, OtpService, EquipeService, StockService, VoucherService, BasketService, NotificationService, AuthAnoynmousService, TranslationLoaderService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor(private translationLoader: TranslationLoaderService, private translateService: TranslateService ) {
    this.translateService.addLangs(["en", "fr"])
    this.translateService.setDefaultLang('en')
    this.translateService.use('fr')        

    this.translationLoader.loadTranslations(english, french)
  }
  
}
