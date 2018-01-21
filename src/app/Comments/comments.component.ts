import { Component, Input, Output, ViewEncapsulation, ViewChild, EventEmitter, OnInit } from '@angular/core';
import { Editor } from 'gg-ui'
import { UserService } from '../Shared/Services/user.service'
import { DataStore } from 'gg-basic-data-services'
import { Observable } from 'rxjs/Rx'
import { SelectableData } from 'gg-basic-code'
import { AuthenticationStatusInfo, AuthService } from '../Shared/Services/auth.service'
import * as moment from "moment"

@Component({
  //moduleId: module.id,
  selector: 'gg-comments',
  host: {
    'class': 'comments'
  },
  templateUrl: './comments.component.html'
})
export class CommentsComponent implements OnInit {
  userMap: Map<string, any>
  @Input() comments;
  @Input() dontShowOldMessages: boolean = false
  @Input() allowNotifyUsers: boolean = false
  @Output() commentsUpdated = new EventEmitter()
  @Output() usersToBeNotified = new EventEmitter()
  
  // We are using an editor for adding new comments and control it directly using a reference
  @ViewChild(Editor) newCommentEditor;


  constructor(private userService: UserService, private authService: AuthService, private dataStore: DataStore) {
  }

  public selectableUsers: Observable<SelectableData[]>;

  ngOnInit(): void {
    if (!this.comments) {
      this.comments = [];
    }
    this.selectableUsers = this.authService.getSelectableUsers();

    this.authService.getAnnotatedUsersHashmap().takeWhile(() => this.isPageRunning).subscribe(map => {
      this.userMap= map
    })
  }

  private isPageRunning: boolean = true

  ngOnDestroy(): void {
    this.isPageRunning = false
  }


  onChanges(changes) {
    if (changes.comments && changes.comments.currentValue === undefined) {
      this.comments = [];
    }
  }

  getPictureFile(comment) {
    var userId= comment.user.id
    return this.userMap.has(userId) ? this.dataStore.getPictureUrl(this.userMap.get(userId).data.pictureFile) : undefined
  }

  addNewComment() {
    this.userService.getCurrentUserObjectForComment().first().subscribe(userrecord => {
      var md = moment()
      const comments = this.comments.slice();
      comments.splice(0, 0, {
        user: userrecord,
        time: md.format('DD/MM/YYYY HH:mm:ss'),
        content: this.newCommentEditor.getEditableContent()
      });
      this.commentsUpdated.next(comments);
      this.newCommentEditor.setEditableContent('');
      if (this.selectedUserIds && this.selectedUserIds.length > 0)
        this.usersToBeNotified.next(this.selectedUserIds)
    });
  }

  onCommentEdited(comment, content) {
    const comments = this.comments.slice();
    if (content.length === 0) {
      comments.splice(comments.indexOf(comment), 1);
    } else {
      comments.splice(comments.indexOf(comment), 1, {
        user: comment.user,
        time: comment.time,
        content
      });
    }
    this.commentsUpdated.next(comments);
  }

  public selectedUserIds: any[] = undefined

  userSelectionChanged(selectedIds: string[]) {
    this.selectedUserIds = selectedIds
  }

}
