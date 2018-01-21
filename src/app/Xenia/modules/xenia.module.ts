import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router';


import { UiModule } from'gg-ui'
import { SearchHandleDataModule } from 'gg-search-handle-data'

import { CommentsModule } from'../../Comments/modules/comments.module'

import { XeniaMainComponent } from '../xenia-main.component'
import { XeniaWelcomeMainComponent } from '../xenia-welcome-main.component'
import { XeniaWelcomeIntroComponent } from '../welcome/welcome-intro.component'
import { XeniaWelcomeNameComponent } from '../welcome/welcome-name.component'
import { XeniaWelcomeNameConfirmComponent } from '../welcome/welcome-name-confirm.component'
import { XeniaWelcomeEmailComponent } from '../welcome/welcome-email.component'
import { XeniaWelcomePiComponent } from '../welcome/welcome-pi.component'
import { XeniaWelcomeFinalComponent } from '../welcome/welcome-final.component'

import { XeniaWelcomeService } from '../services/welcome.service'
import { TeambuilderService } from '../services/teambuilder.service'
import { AuthService } from '../services/authorization.service'
import {GigaFindPersonComponent} from '../TeamBuilder/Controls/giga-find-person.component'
import {GigaPersonsSelectionComponent} from '../TeamBuilder/giga-persons-selection.component'
import {GigaPersonDetailComponent} from '../TeamBuilder/giga-person-detail.component'
import {GigaPersonListComponent} from '../TeamBuilder/giga-person-list.component'
import {GigaPersonTaskComponent} from '../TeamBuilder/giga-person-task.component'
import {GigaPersonEnterComponent} from '../TeamBuilder/giga-person-enter.component'


import {OrganiGigaMain} from '../TeamBuilder/organi.giga-main.component'
import {OrganiTeamDetail} from '../TeamBuilder/organi.team-detail.component'
import {OrganiTeamList} from '../TeamBuilder/organi.team-list.component'
import {OrganiUnitDetail} from '../TeamBuilder/organi.unit-detail.component'
import {OrganiUnitList} from '../TeamBuilder/organi.unit-list.component'

import {TasksHeadComponent} from '../TeamBuilder/tasks.head.component'
import {TasksTrudComponent} from '../TeamBuilder/tasks.trud.component'
import {TasksPiComponent} from '../TeamBuilder/tasks.pi.component'

import {PiTypeChoiceComponent} from '../TeamBuilder/pi.type.choice.component'


@NgModule({
  imports: [
    NgbModule, CommonModule, TranslateModule, RouterModule,
    FormsModule, ReactiveFormsModule, UiModule, CommentsModule, SearchHandleDataModule
  ],
  declarations: [
    XeniaMainComponent, XeniaWelcomeMainComponent, 
    XeniaWelcomeIntroComponent, XeniaWelcomeNameComponent, XeniaWelcomeNameConfirmComponent, XeniaWelcomeEmailComponent, XeniaWelcomePiComponent, XeniaWelcomeFinalComponent,
    GigaFindPersonComponent, GigaPersonsSelectionComponent, GigaPersonDetailComponent, GigaPersonListComponent, GigaPersonTaskComponent, TasksHeadComponent, TasksTrudComponent, TasksPiComponent,
    PiTypeChoiceComponent,
    OrganiGigaMain, OrganiTeamDetail, OrganiTeamList, OrganiUnitDetail, OrganiUnitList, GigaPersonEnterComponent
  ],
  exports: [
      XeniaMainComponent, XeniaWelcomeMainComponent, GigaPersonsSelectionComponent, TasksHeadComponent, TasksTrudComponent, TasksPiComponent, OrganiGigaMain
  ],
  providers: [
      XeniaWelcomeService, TeambuilderService, AuthService
    ],
  bootstrap: [
    XeniaMainComponent
  ]
})
export class XeniaModule { }

