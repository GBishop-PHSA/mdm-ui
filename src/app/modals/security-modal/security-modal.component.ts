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
   selector: 'mdm-security-modal',
   templateUrl: './security-modal.component.html',
   styleUrls: ['./security-modal.component.scss']
})
export class SecurityModalComponent implements OnInit {
   element = '';
   domainType = '';
   constructor(
      private dialogRef: MatDialogRef<SecurityModalComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

   ngOnInit(): void {
      this.element = this.data.element ? this.data.element : '';
      this.domainType = this.data.domainType ? this.data.domainType : '';
   }

   close() {
      this.dialogRef.close({ status: 'close' });
    }
}
