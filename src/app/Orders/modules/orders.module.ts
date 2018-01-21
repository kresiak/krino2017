import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { UiModule } from'gg-ui'
import { SearchHandleDataModule } from 'gg-search-handle-data'

import { CommentsModule } from'../../Comments/modules/comments.module'

import { OrderDetailComponent } from '../order-detail.component'
import { OrderListComponent } from '../order-list.component'

@NgModule({
  imports: [
    NgbModule, CommonModule, TranslateModule, SearchHandleDataModule,
    FormsModule, ReactiveFormsModule, UiModule, CommentsModule
  ],
  declarations: [
      OrderDetailComponent, OrderListComponent, 
  ],
  exports: [
      OrderDetailComponent, OrderListComponent, 
  ],
  providers: [
    ],
  bootstrap: []
})
export class OrdersModule { }

