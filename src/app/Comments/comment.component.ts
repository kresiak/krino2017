import { Component, Input, Output, ViewEncapsulation, EventEmitter } from '@angular/core';
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'

@Component({
  //moduleId: module.id,
  selector: 'gg-comment',
  host: {
    'class': 'comment'
  },
  templateUrl: './comment.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class CommentComponent {
  isFromCurrentUser: boolean= false;
  constructor(private authService: AuthService) {
  }

  @Input() time;
  @Input() user;
  @Input() picture: string= undefined;
  @Input() content;
  @Output() commentEdited = new EventEmitter();

  private isPageRunning: boolean = true

  ngOnDestroy(): void {
    this.isPageRunning = false
  }

  ngOnInit(): void {
    this.authService.getStatusObservable().takeWhile(() => this.isPageRunning).subscribe(statusInfo => {
      this.isFromCurrentUser = statusInfo.isLoggedIn && statusInfo.currentUserId === this.user.id
    })
  }

  onEditSaved(content) {
    this.commentEdited.next(content);
  }
}
