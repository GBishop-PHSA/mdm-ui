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
import { MdmResourcesService } from '@mdm/modules/resources';
import { EditableDataModel } from '@mdm/model/dataModelModel';
import {
   Component,
   OnInit,
   Input,
   ViewChildren,
   QueryList,
   ViewChild,
   ElementRef,
   Renderer2,
   AfterViewInit, OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '@mdm/services/message.service';
import { SecurityHandlerService } from '@mdm/services/handlers/security-handler.service';
import { MessageHandlerService } from '@mdm/services/utility/message-handler.service';
import { StateHandlerService } from '@mdm/services/handlers/state-handler.service';
import { SharedService } from '@mdm/services/shared.service';
import { ReferenceModelResult } from '@mdm/model/referenceModelModel';
import { ConfirmationModalComponent } from '@mdm/modals/confirmation-modal/confirmation-modal.component';
import { FavouriteHandlerService } from '@mdm/services/handlers/favourite-handler.service';
import { ExportHandlerService } from '@mdm/services/handlers/export-handler.service';
import { BroadcastService } from '@mdm/services/broadcast.service';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

@Component({
   selector: 'mdm-reference-data-details',
   templateUrl: './reference-data-details.component.html',
   styleUrls: ['./reference-data-details.component.scss']
})

export class ReferenceDataDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
   @Input() afterSave: any;
   @Input() editMode = false;
   @ViewChildren('editableText') editForm: QueryList<any>;
   @ViewChild('aLink', { static: false }) aLink: ElementRef;
   result: ReferenceModelResult;
   hasResult = false;
   subscription: Subscription;
   showSecuritySection: boolean;
   showUserGroupAccess: boolean;
   showEdit: boolean;
   showPermission: boolean;
   showDelete: boolean;
   showSoftDelete: boolean;
   showPermDelete: boolean;
   isAdminUser: boolean;
   isLoggedIn: boolean;
   deleteInProgress: boolean;
   exporting: boolean;
   editableForm: EditableDataModel;
   errorMessage = '';
   processing = false;
   exportError = null;
   exportedFileIsReady = false;
   exportList = [];
   addedToFavourite = false;
   download: any;
   downloadLink: any;
   urlText: any;
   canEditDescription = true;
   showEditDescription = false;

   constructor(
      private renderer: Renderer2,
      private resourcesService: MdmResourcesService,
      private messageService: MessageService,
      private messageHandler: MessageHandlerService,
      private securityHandler: SecurityHandlerService,
      private stateHandler: StateHandlerService,
      private sharedService: SharedService,
      private broadcastSvc: BroadcastService,
      private dialog: MatDialog,
      private favouriteHandler: FavouriteHandlerService,
      private exportHandler: ExportHandlerService,
      private title: Title
   ) { }

   ngOnInit() {
      this.isAdminUser = this.sharedService.isAdmin;
      this.isLoggedIn = this.securityHandler.isLoggedIn();
      this.loadExporterList();
      this.ReferenceModelDetails();

      this.editableForm = new EditableDataModel();
      this.editableForm.visible = false;
      this.editableForm.deletePending = false;

      this.editableForm.show = () => {
         this.editForm.forEach(x =>
            x.edit({
               editing: true,
               focus: x.name === 'moduleName' ? true : false
            })
         );
         this.editableForm.visible = true;
      };

      this.editableForm.cancel = () => {
         this.editForm.forEach(x => x.edit({ editing: false }));
         this.editableForm.visible = false;
         this.editableForm.validationError = false;
         this.errorMessage = '';
         this.setEditableFormData();
         if (this.result.classifiers) {
            this.result.classifiers.forEach(item => {
               this.editableForm.classifiers.push(item);
            });
         }
         if (this.result.aliases) {
            this.result.aliases.forEach(item => {
               this.editableForm.aliases.push(item);
            });
         }
      };

      this.subscription = this.messageService.changeUserGroupAccess.subscribe((message: boolean) => {
         this.showSecuritySection = message;
      });
   }

   ngAfterViewInit(): void {
      this.editForm.changes.subscribe(() => {
         if (this.editMode) {
            this.editForm.forEach(x => x.edit({
               editing: true,
               focus: x.name === 'moduleName' ? true : false
            }));
            this.showForm();
         }
      });
   }

   ReferenceModelDetails(): any {
      this.subscription = this.messageService.dataChanged$.subscribe(serverResult => {
         this.result = serverResult;
         this.setEditableFormData();

         if (this.result.classifiers) {
            this.result.classifiers.forEach(item => {
               this.editableForm.classifiers.push(item);
            });
         }
         if (this.result.aliases) {
            this.result.aliases.forEach(item => {
               this.editableForm.aliases.push(item);
            });
         }

         if (this.result != null) {
            this.hasResult = true;
            this.watchReferenceDataModelObject();
         }
         this.title.setTitle(`${this.result?.type} - ${this.result?.label}`);
      });
   }

   watchReferenceDataModelObject() {
      const access: any = this.securityHandler.elementAccess(this.result);
      if (access !== undefined) {
         this.showEdit = access.showEdit;
         this.showPermission = access.showPermission;
         this.showDelete = access.showPermanentDelete || access.showSoftDelete;
         this.showSoftDelete = access.showSoftDelete;
         this.showPermDelete = access.showPermanentDelete;
         this.canEditDescription = access.canEditDescription;
      }
      this.addedToFavourite = this.favouriteHandler.isAdded(this.result);
   }

   toggleSecuritySection() {
      this.messageService.toggleUserGroupAccess();
   }
   toggleShowSearch() {
      this.messageService.toggleSearch();
   }

   ngOnDestroy() {
      // unsubscribe to ensure no memory leaks
      this.subscription.unsubscribe();
   }

   delete(permanent) {
      if (!this.showDelete) {
         return;
      }
      this.deleteInProgress = true;

      this.resourcesService.referenceDataModel.remove(this.result.id, { permanent }).subscribe(() => {
         if (permanent) {
            this.broadcastSvc.broadcast('$reloadFoldersTree');
            this.stateHandler.Go('allDataModel', { reload: true, location: true }, null);
         } else {
            this.broadcastSvc.broadcast('$reloadFoldersTree');
            this.stateHandler.reload();
         }
      }, error => {
         this.deleteInProgress = false;
         this.messageHandler.showError('There was a problem deleting the Reference Data Model.', error);
      });
   }

   askForSoftDelete() {
      if (!this.showSoftDelete) {
         return;
      }
      const promise = new Promise(() => {
         const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: {
               title: 'Are you sure you want to delete this Reference Data Model?',
               okBtnTitle: 'Yes, delete',
               btnType: 'warn',
               message: `<p class="marginless">This Reference Data Model will be marked as deleted and will not be viewable by users </p>
                    <p class="marginless">except Administrators.</p>`
            }
         });

         dialog.afterClosed().subscribe(result => {
            if (result != null && result.status === 'ok') {
               this.processing = true;
               this.delete(false);
               this.processing = false;
            } else {
               return;
            }
         });
      });
      return promise;
   }

   askForPermanentDelete(): any {
      if (!this.showPermDelete) {
         return;
      }
      const promise = new Promise(() => {
         const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: {
               title: 'Permanent deletion',
               okBtnTitle: 'Yes, delete',
               btnType: 'warn',
               message: 'Are you sure you want to <span class=\'warning\'>permanently</span> delete this Reference Data Model?'
            }
         });

         dialog.afterClosed().subscribe(result => {
            if (result?.status !== 'ok') {
               return;
            }
            const dialog2 = this.dialog.open(ConfirmationModalComponent, {
               data: {
                  title: 'Confirm permanent deletion',
                  okBtnTitle: 'Confirm deletion',
                  btnType: 'warn',
                  message: `<p class='marginless'><strong>Note: </strong>All its 'Types', 'Elements' and 'Data Values'
                      <p class='marginless'>will be deleted <span class='warning'>permanently</span>.</p>`
               }
            });

            dialog2.afterClosed().subscribe(result2 => {
               if (result != null && result2.status === 'ok') {
                  this.delete(true);
               } else {
                  return;
               }
            });
         });
      });
      return promise;
   }

   formBeforeSave = () => {
      this.editMode = false;
      this.errorMessage = '';

      const classifiers = [];
      this.editableForm.classifiers.forEach(cls => {
         classifiers.push(cls);
      });
      const aliases = [];
      this.editableForm.aliases.forEach(alias => {
         aliases.push(alias);
      });
      let resource = {};
      if (!this.showEditDescription) {
         resource = {
            id: this.result.id,
            label: this.editableForm.label,
            description: this.editableForm.description || '',
            author: this.editableForm.author,
            organisation: this.editableForm.organisation,
            type: this.result.type,
            domainType: this.result.domainType,
            aliases,
            classifiers
         };
      }

      if (this.showEditDescription) {
         resource = {
            id: this.result.id,
            description: this.editableForm.description || ''
         };
      }

      if (this.validateLabel(this.result.label)) {
         this.resourcesService.referenceDataModel.update(this.result.id, resource).subscribe(res => {
            if (this.afterSave) {
               this.afterSave(res);
            }
            this.result.description = res.body.description;
            this.ReferenceModelDetails();
            this.messageHandler.showSuccess('Reference Data Model updated successfully.');
            this.editableForm.visible = false;
            this.editForm.forEach(x => x.edit({ editing: false }));
            this.broadcastSvc.broadcast('$reloadFoldersTree');
         }, error => {
            this.messageHandler.showError('There was a problem updating the Reference Data Model.', error);
         });
      }
   };

   validateLabel(data): any {
      if (!data || (data && data.trim().length === 0)) {
         this.errorMessage = 'Name field cannot be empty';
         return false;
      } else {
         return true;
      }
   }

   showForm() {
      this.showEditDescription = false;
      this.editableForm.show();
   }

   onCancelEdit() {
      this.errorMessage = '';
      this.editMode = false; // Use Input editor whe adding a new folder.
      this.showEditDescription = false;
   }

   toggleFavourite() {
      if (this.favouriteHandler.toggle(this.result)) {
         this.addedToFavourite = this.favouriteHandler.isAdded(this.result);
      }
   }

   export(exporter) {
      this.exportError = null;
      this.processing = true;
      this.exportedFileIsReady = false;
      this.exportHandler.exportDataModel([this.result], exporter, 'referenceDataModels').subscribe(result => {
         if (result != null) {
            this.exportedFileIsReady = true;
            const label = [this.result].length === 1 ? [this.result][0].label : 'reference_models';
            const fileName = this.exportHandler.createFileName(label, exporter);
            const file = new Blob([result.body], { type: exporter.fileType });
            const link = this.exportHandler.createBlobLink(file, fileName);

            this.processing = false;
            this.renderer.appendChild(this.aLink.nativeElement, link);
         } else {
            this.processing = false;
            this.messageHandler.showError('There was a problem exporting the Reference Data Model.', '');
         }
      }, error => {
         this.processing = false;
         this.messageHandler.showError('There was a problem exporting the Reference Data Model.', error);
      });
   }

   loadExporterList() {
      this.exportList = [];
      this.securityHandler.isAuthenticated().subscribe(result => {
         if (result.body === false) {
            return;
         }

         this.resourcesService.referenceDataModel.exporters().subscribe(res => {
            this.exportList = res.body;
         }, error => {
            this.messageHandler.showError('There was a problem loading exporters list.', error);
         });
      });
   }

   onLabelChange(value: any) {
      if (!this.validateLabel(value)) {
         this.editableForm.validationError = true;
      } else {
         this.editableForm.validationError = false;
         this.errorMessage = '';
      }
   }

   showDescription = () => {
      this.showEditDescription = true;
      this.editableForm.show();
   };

   private setEditableFormData() {
      this.editableForm.description = this.result.description;
      this.editableForm.label = this.result.label;
      this.editableForm.organisation = this.result.organisation;
      this.editableForm.author = this.result.author;
   }

}