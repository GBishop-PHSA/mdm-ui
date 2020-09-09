/*
Copyright 2020 University of Oxford

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'mdm-finalise-modal',
  templateUrl: './finalise-modal.component.html',
  styleUrls: ['./finalise-modal.component.scss']
})
export class FinaliseModalComponent implements OnInit {
  title: string;
  message: string;
  username: string;
  password: string;
  okTitle: string;
  cancelTitle: string;
  cancelShown: boolean;
  btnType: string;
  isSubmitDisabled = true;

  versions: Array<any> = [
    {name: 'Major', value: 'MAJOR'},
    {name: 'Minor', value: 'MINOR'},
    {name: 'Patch', value: 'PATCH'}
  ];

  constructor(private dialogRef: MatDialogRef<FinaliseModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 
  }

  ngOnInit() {
    this.okTitle = this.data.okBtnTitle ? this.data.okBtnTitle : 'OK';
    this.btnType = this.data.btnType ? this.data.btnType : 'primary';
    this.cancelTitle = this.data.cancelBtnTitle ? this.data.cancelBtnTitle : 'Cancel';
    this.title = this.data.title;
    this.message = this.data.message;
    this.password = '';
    this.cancelShown = this.data.cancelShown != null ? this.data.cancelShown : true;
  }

  onVersionChange()
  {
    this.isSubmitDisabled = (this.data.versionNumber === "underfined" && this.data.versionList === "underfined" && this.data.versionNumber === "")
  }

  ok() {
    this.dialogRef.close({ status: 'ok' ,  data : this.data });
  }

  cancel() {
    this.dialogRef.close({ status: 'cancel' });
  }

  close() {
    this.dialogRef.close({ status: 'close' });
  }

}