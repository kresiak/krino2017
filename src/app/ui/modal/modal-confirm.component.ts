import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap'
import {Component, Input} from '@angular/core'

@Component({
  selector: 'gg-modal-confirm',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{titleKey | translate}}</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <p *ngIf="explicationKey">{{explicationKey | translate}}</p>
      <p>{{questionKey | translate}}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-warning" (click)="closeModal()">{{'UI.GENERAL.YES' | translate}}</button>
      <button type="button" class="btn btn-info" (click)="activeModal.dismiss('Cancel click')">{{'UI.GENERAL.CANCEL' | translate}}</button>
    </div>
  `
})
export class ModalConfirmComponent {
  @Input() explicationKey: string= undefined
  @Input() questionKey: string= 'UI.MODAL.DEFAULT QUESTION'
  @Input() titleKey: string= 'UI.MODAL.DEFAULT TITLE'
  @Input() fnCloseAction= undefined

  constructor(public activeModal: NgbActiveModal) {}

  closeModal() {
      if (this.fnCloseAction) 
        this.fnCloseAction()
    this.activeModal.close()
  }
}