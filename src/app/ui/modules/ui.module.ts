import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2AutoCompleteModule } from 'ng2-auto-complete';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ImageUploadModule } from "angular2-image-upload"

import { Editor } from '../editor/editor'
import { EditorAutocomplete } from '../editor/editor-autocomplete'
import { EditorAutocompleteText } from '../editor/editor-autocomplete-text'
import { EditorNumber } from '../editor/editor-number'
import { EditorDate } from '../editor/editor-date'
import { EditorBoolean } from '../editor/editor-boolean'
import { Checkbox } from '../checkbox/checkbox'
import { CheckboxDelete } from '../confirmation/checkbox-delete.component'
import { ButtonActionConfirm } from '../confirmation/button-action.component'

import { SimpleTinyComponent } from '../editor/editor-wysiwyg'
import { EditorTinyMce } from '../editor/editor-tnymce'

import { SelectorComponent } from '../selector/selector.component'
import { HelpPointerComponent } from '../help/help-pointer.component'
import { DatePointerComponent } from '../help/date-pointer.component'
import { TextCompactComponent } from '../help/text-compact.component'
import { LinesTooltipComponent } from '../help/lines-tooltip.component'

import { SearchBoxComponent } from '../search/search-box.component'

import { CompactDatePipe } from '../../Shared/Pipes/compactdate.pipe'
import { FullDatePipe } from '../../Shared/Pipes/fulldate.pipe'
import { ShortDatePipe } from '../../Shared/Pipes/shortdate.pipe'
import { FromNowPipe } from '../../Shared/Pipes/fromnow.pipe'
import { GigaCurrencyPipe } from '../../Shared/Pipes/ggcurrency.pipe'

import { FocusDirective } from '../../Shared/Directives/focus.directive'


import { ModalConfirmComponent } from '../modal/modal-confirm.component'

import { ImageUploaderComponent } from '../upload/image-uploader.component'
import { ImageUploaderViewerComponent } from '../upload/image-uploader-viewer.component'

import { SigninEnterComponent } from '../login/signin-enter.component'

import { TranslationLoaderService } from 'gg-translation'

import { SearchBoxService} from '../search/search-box.service'

import { locale as english } from '../locale/en'
import { locale as french } from '../locale/fr'

@NgModule({
  imports: [
    ImageUploadModule.forRoot(),
    Ng2AutoCompleteModule, NgbModule, CommonModule, TranslateModule,
    FormsModule, ReactiveFormsModule
  ],
  declarations: [
    Editor, EditorNumber, EditorDate, EditorBoolean, Checkbox, CheckboxDelete, ButtonActionConfirm, SelectorComponent, EditorAutocomplete, EditorAutocompleteText,
    SimpleTinyComponent, EditorTinyMce,
    HelpPointerComponent, DatePointerComponent, TextCompactComponent, SearchBoxComponent,
    FullDatePipe, ShortDatePipe, FromNowPipe, CompactDatePipe, ModalConfirmComponent, ImageUploaderComponent, ImageUploaderViewerComponent, GigaCurrencyPipe,
    FocusDirective, SigninEnterComponent, LinesTooltipComponent
  ],
  exports: [
    Editor, EditorNumber, EditorDate, EditorBoolean, Checkbox, CheckboxDelete, ButtonActionConfirm, SelectorComponent, EditorAutocomplete, EditorAutocompleteText,
    HelpPointerComponent, DatePointerComponent, TextCompactComponent, SearchBoxComponent,
    SimpleTinyComponent, EditorTinyMce,
    FullDatePipe, ShortDatePipe, FromNowPipe, CompactDatePipe, GigaCurrencyPipe,
    ModalConfirmComponent, ImageUploaderComponent, ImageUploaderViewerComponent,
    FocusDirective, SigninEnterComponent, LinesTooltipComponent
  ],
  providers: [
  ],
  entryComponents: [
    ModalConfirmComponent
  ],
  bootstrap: []
})
export class UiModule {
  constructor(private translationLoader: TranslationLoaderService) {
    this.translationLoader.loadTranslations(english, french)
  }

  static forRoot() {
    return {
      ngModule: UiModule,
      providers: [ SearchBoxService  ]
    }
  }
  
}
