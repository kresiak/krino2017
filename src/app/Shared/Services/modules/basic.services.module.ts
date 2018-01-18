import { NgModule } from '@angular/core';

import { AdminService } from '../admin.service';
import { ProductService } from '../product.service'
import { AuthService } from '../auth.service'

@NgModule({
    providers: [ ]
})
export class BasicServicesModule {
  static forRoot() {
    return {
      ngModule: BasicServicesModule,
      providers: [ AuthService, AdminService, ProductService  ]
    }
  }
}