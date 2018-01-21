import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Ng2AutoCompleteModule } from 'ng2-auto-complete';

import { TranslateModule } from '@ngx-translate/core'

import { UiModule } from'gg-ui'
import { SearchHandleDataModule } from 'gg-search-handle-data'
import { ProductsModule } from'../../products/modules/products.module'

import { PlatformMainComponent } from '../platform-main-component'
import { PlatformMachinesComponent } from '../platform-machines.component'
import { PlatformServicesComponent } from '../platform-services.component'
import { PlatformServiceStepListComponent } from '../platform-service-step-list.component'
import { PlatformServiceListComponent } from '../platform-service-list.component'
import { PlatformServiceDetailComponent } from '../platform-service-detail.component'
import { PlatformServiceStepDetailComponent } from '../platform-service-step-detail.component'
import { PlatformServiceStepClientTypeCostComponent } from '../platform-service-step-clientType-cost.component'
import { PlatformLabourComponent } from '../platform-labour.component'
import { PlatformClientComponent } from '../platform-clientTypes.component'
import { PlatformCorrectionComponent } from '../platform-correction.component'
import { PlatformServiceSnapshotsComponent } from '../platform-service-snapshots.component'
import { PlatformServiceSnapshotListComponent } from '../platform-service-snapshot-list.component'
import { PlatformServiceSnapshotDetailComponent } from '../platform-service-snapshot-detail.component'
import { PlatformServiceCompareComponent } from '../platform-service-compare.component'
import { PlatformServiceCompareBaseComponent } from '../platform-service-compare-base.component'
import { PlatformClientsComponent } from '../platform-clients.component'
import { PlatformEnterprisesComponent } from '../platform-enterprises.component'
import { PlatformOffersComponent } from '../platform-offers.component'
import { PlatformOfferDetailComponent } from '../platform-offer-detail.component'
import { PlatformOfferListComponent } from '../platform-offer-list.component'

import { PlatformService } from '../../Shared/Services/platform.service'

@NgModule({
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    Ng2AutoCompleteModule,
    NgbModule,
    TranslateModule,
    UiModule, ProductsModule, SearchHandleDataModule
  ],
  declarations: [
    PlatformMainComponent, PlatformMachinesComponent, PlatformServicesComponent, PlatformServiceStepListComponent, PlatformServiceStepDetailComponent, PlatformServiceSnapshotsComponent, PlatformServiceSnapshotListComponent,
    PlatformLabourComponent, PlatformClientComponent, PlatformCorrectionComponent, PlatformServiceListComponent, PlatformServiceDetailComponent, PlatformServiceCompareComponent, PlatformServiceCompareBaseComponent, PlatformClientsComponent,
    PlatformServiceSnapshotDetailComponent, PlatformServiceStepClientTypeCostComponent, PlatformEnterprisesComponent, PlatformOffersComponent, PlatformOfferDetailComponent, PlatformOfferListComponent
    ],
  providers: [],
  bootstrap: [PlatformMainComponent],
  exports: [PlatformMainComponent]
})
export class PlatformModule { 
  static forRoot() {
    return {
      ngModule: PlatformModule,
      providers: [  PlatformService ]
    }
  }    
}
