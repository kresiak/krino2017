import { NgModule } from '@angular/core';

import { ApiService } from '../api.service';
import { DataStore } from '../data.service';
import { ConfigService } from '../config.service'
import { WebSocketService } from '../websocket.service'

@NgModule({
    providers: [ ]
})
export class BasicDataServicesModule {
  static forRoot() {
    return {
      ngModule: BasicDataServicesModule,
      providers: [ WebSocketService, ConfigService, ApiService, DataStore  ]
    }
  }
}