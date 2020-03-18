import { ResourcesService } from '../services/resources.service';
// @ts-ignore
import { EditableDataModel } from '../model/dataModelModel';
import {
  Component,
  OnInit,
  Input,
  ViewChildren,
  QueryList,
  ViewChild,
  ContentChildren,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  AfterViewInit, OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../services/message.service';
import { SecurityHandlerService } from '../services/handlers/security-handler.service';
import { MarkdownTextAreaComponent } from '../utility/markdown-text-area.component';
import { MessageHandlerService } from '../services/utility/message-handler.service';
import { StateHandlerService } from '../services/handlers/state-handler.service';

import { HelpDialogueHandlerService } from '../services/helpDialogue.service';
import { ElementSelectorDialogueService } from '../services/element-selector-dialogue.service';
import { SharedService } from '../services/shared.service';
import { DataModelResult } from '../model/dataModelModel';
import { ConfirmationModalComponent } from '../modals/confirmation-modal/confirmation-modal.component';
import { FavouriteHandlerService } from '../services/handlers/favourite-handler.service';
import { ExportHandlerService } from '../services/handlers/export-handler.service';
import { BroadcastService } from '../services/broadcast.service';
import { DialogPosition, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'mdm-data-model-detail',
  templateUrl: './data-model-detail.component.html',
  styleUrls: ['./data-model-detail.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class DataModelDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  result: DataModelResult;
  hasResult = false;
  subscription: Subscription;
  showSecuritySection: boolean;
  showUserGroupAccess: boolean;
  showEdit: boolean;
  showFinalise: boolean;
  showPermission: boolean;
  showDelete: boolean;
  isAdminUser: boolean;
  isLoggedIn: boolean;
  deleteInProgress: boolean;
  exporting: boolean;
  editableForm: EditableDataModel;
  errorMessage = '';
  showEditMode = false;
  processing = false;
  showNewVersion = false;
  compareToList = [];
  exportError = null;
  exportedFileIsReady = false;
  exportList = [];
  addedToFavourite = false;
  @ViewChild('aLink', { static: false }) aLink: ElementRef;
  download: any;
  downloadLink: any;
  urlText: any;
  @Input() afterSave: any;
  @Input() editMode = false;

  @ViewChildren('editableText') editForm: QueryList<any>;
  @ViewChildren('editableTextAuthor') editFormAuthor: QueryList<any>;
  @ViewChildren('editableTextOrganisation') editFormOrganisation: QueryList<
    any
  >;

  @ContentChildren(MarkdownTextAreaComponent) editForm1: QueryList<any>;
  // @ViewChildren("aliases") aliases: QueryList<any>;

  constructor(
    private renderer: Renderer2,
    private resourcesService: ResourcesService,
    private messageService: MessageService,
    private messageHandler: MessageHandlerService,
    private securityHandler: SecurityHandlerService,
    private stateHandler: StateHandlerService,
    private sharedService: SharedService,
    private elementDialogueService: ElementSelectorDialogueService,
    private broadcastSvc: BroadcastService,
    private helpDialogueService: HelpDialogueHandlerService,
    private dialog: MatDialog,
    private favouriteHandler: FavouriteHandlerService,
    private exportHandler: ExportHandlerService
  ) {
    // securitySection = false;
    this.isAdminUser = this.sharedService.isAdmin;
    this.isLoggedIn = this.securityHandler.isLoggedIn();
    this.loadExporterList();
    this.DataModelDetails();
  }
  public showAddElementToMarkdown() {
    // Remove from here & put in markdown
    this.elementDialogueService.open(
      'Search_Help',
      'left' as DialogPosition,
      null,
      null
    );
  }

  ngOnInit() {
    this.editableForm = new EditableDataModel();
    this.editableForm.visible = false;
    this.editableForm.deletePending = false;

    this.editableForm.show = () => {
      this.editForm.forEach(x =>
        x.edit({
          editing: true,
          focus: x._name === 'moduleName' ? true : false
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

    this.subscription = this.messageService.changeUserGroupAccess.subscribe(
      (message: boolean) => {
        this.showSecuritySection = message;
      }
    );
    // this.subscription = this.messageService.changeSearch.subscribe((message: boolean) => {
    //   this.showSearch = message;
    // });
  }

  private setEditableFormData() {
    this.editableForm.description = this.result.description;
    this.editableForm.label = this.result.label;
    this.editableForm.organisation = this.result.organisation;
    this.editableForm.author = this.result.author;
  }

  ngAfterViewInit(): void {
    // Subscription emits changes properly from component creation onward & correctly invokes `this.invokeInlineEditor` if this.inlineEditorToInvokeName is defined && the QueryList has members
    this.editForm.changes.subscribe(() => {
      this.invokeInlineEditor();
      // setTimeout work-around prevents Angular change detection `ExpressionChangedAfterItHasBeenCheckedError` https://blog.angularindepth.com/everything-you-need-to-know-about-the-expressionchangedafterithasbeencheckederror-error-e3fd9ce7dbb4

      if (this.editMode) {
        this.editForm.forEach(x =>
          x.edit({
            editing: true,
            focus: x._name === 'moduleName' ? true : false
          })
        );
        this.showForm();
      }
    });
  }

  private invokeInlineEditor(): void {}

  // private onInlineEditorEdit(editEvent: InlineEditorEvent): void {
  //     console.log(editEvent); // OUTPUT: Only logs event when inlineEditor appears in template
  // }

  DataModelDetails(): any {
    this.subscription = this.messageService.dataChanged$.subscribe(
      serverResult => {
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
        if (this.result.semanticLinks) {
          this.result.semanticLinks.forEach(link => {
            if (link.linkType === 'New Version Of') {
              this.compareToList.push(link.target);
            }
          });
        }

        if (this.result.semanticLinks) {
          this.result.semanticLinks.forEach(link => {
            if (link.linkType === 'Superseded By') {
              this.compareToList.push(link.target);
            }
          });
        }

        if (this.result != null) {
          this.hasResult = true;
          this.watchDataModelObject();
        }
      }
    );
  }

  watchDataModelObject() {
    const access: any = this.securityHandler.elementAccess(this.result);
    if (access !== undefined) {
      this.showEdit = access.showEdit;
      this.showPermission = access.showPermission;
      this.showDelete = access.showDelete;
      this.showFinalise = access.showFinalise;
      this.showNewVersion = access.showNewVersion;
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

  // markDonw(text) {
  //     if (text === null || text === undefined) {
  //         return '';
  //     }
  //     /* tslint:disable:no-string-literal */
  //     return window['marked'](text);
  // }

  delete(permanent) {
    if (!this.securityHandler.isAdmin()) {
      return;
    }
    const queryString = permanent ? 'permanent=true' : null;
    this.deleteInProgress = true;

    this.resourcesService.dataModel
      .delete(this.result.id, null, queryString, null)
      .subscribe(
        () => {
          if (permanent) {
            this.broadcastSvc.broadcast('$reloadFoldersTree');
            this.stateHandler.Go(
              'allDataModel',
              { reload: true, location: true },
              null
            );
          } else {
            this.broadcastSvc.broadcast('$reloadFoldersTree');
            this.stateHandler.reload();
          }
        },
        error => {
          this.deleteInProgress = false;
          this.messageHandler.showError(
            'There was a problem deleting the Data Model.',
            error
          );
        }
      );
  }

  askForSoftDelete() {
    if (!this.securityHandler.isAdmin()) {
      return;
    }
    const promise = new Promise(() => {
      const dialog = this.dialog.open(ConfirmationModalComponent, {
        hasBackdrop: false,
        data: {
          title: 'Data Model',
          message:
            'Are you sure you want to delete this Data Model?<br>The Data Model will be marked as deleted and will not be viewable by users except Administrators.'
        }
      });

      dialog.afterClosed().subscribe(result => {
        if (result.status !== 'ok') {
          // reject("cancelled");
          return promise;
        }
        this.processing = true;
        this.delete(false);
        this.processing = false;
      });
    });
    return promise;
  }

  askForPermanentDelete(): any {
    if (!this.securityHandler.isAdmin()) {
      return;
    }
    const promise = new Promise(() => {
      const dialog = this.dialog.open(ConfirmationModalComponent, {
        hasBackdrop: false,
        data: {
          title: 'Data Model',
          message:
            'Are you sure you want to <span class=\'errorMessage\'>permanently</span> delete this Data Model?'
        }
      });

      dialog.afterClosed().subscribe(result => {
        if (result.status !== 'ok') {
          // reject(null); Commented by AS as it was throwing error
          return;
        }
        const dialog2 = this.dialog.open(ConfirmationModalComponent, {
          hasBackdrop: false,
          data: {
            title: 'Data Model',
            message:
              '<strong>Are you sure?</strong><br>All its \'Data Classes\', \'Data Elements\' and \'Data Types\' will be deleted <span class=\'errorMessage\'>permanently</span>.'
          }
        });

        dialog2.afterClosed().subscribe(result2 => {
          if (result2.status !== 'ok') {
            // reject(null);
            return;
          }
          this.delete(true);
        });
      });
    });

    return promise;
  }

  formBeforeSave = function() {
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
    const resource = {
      id: this.result.id,
      label: this.editableForm.label,
      description: this.editableForm.description,
      author: this.editableForm.author,
      organisation: this.editableForm.organisation,
      type: this.result.type,
      domainType: this.result.domainType,
      aliases,
      classifiers
    };

    if (this.validateLabel(this.result.label)) {
      this.resourcesService.dataModel
        .put(resource.id, null, { resource })
        .subscribe(
          result => {
            if (this.afterSave) {
              this.afterSave(result);
            }
            this.messageHandler.showSuccess('Data Model updated successfully.');
            this.editableForm.visible = false;
            this.editForm.forEach(x => x.edit({ editing: false }));
          },
          error => {
            this.messageHandler.showError(
              'There was a problem updating the Data Model.',
              error
            );
          }
        );
    }
  };

  validateLabel(data): any {
    if (!data || (data && data.trim().length === 0)) {
      this.errorMessage = 'DataModel name can not be empty';
      return false;
    } else {
      return true;
    }
  }

  showForm() {
    this.editableForm.show();
  }

  onCancelEdit() {
    this.errorMessage = '';
    this.editMode = false; // Use Input editor whe adding a new folder.
  }

  public loadHelp() {
    this.helpDialogueService.open('Edit_model_details', {
      my: 'right top',
      at: 'bottom'
    } as DialogPosition);
  }

  toggleFavourite() {
    if (this.favouriteHandler.toggle(this.result)) {
      this.addedToFavourite = this.favouriteHandler.isAdded(this.result);
    }
  }

  finalise() {
    const promise = new Promise(() => {
      const dialog = this.dialog.open(ConfirmationModalComponent, {
        hasBackdrop: true,
        autoFocus: false,
        data: {
          title: 'Are you sure you want to finalise the Data Model ?',
          okBtnTitle: 'Finalise model',
          message:
            'Once you finalise a Data Model, you can not edit it anymore!<br> \n' +
            'but you can create new version of it.'
        }
      });

      dialog.afterClosed().subscribe(result => {
        if (result.status !== 'ok') {
          // reject("cancelled");
          return promise;
        }
        this.processing = true;
        this.resourcesService.dataModel
          .put(this.result.id, 'finalise', null)
          .subscribe(
            () => {
              this.processing = false;
              this.messageHandler.showSuccess(
                'Data Model finalised successfully.'
              );
              this.stateHandler.Go(
                'datamodel',
                { id: this.result.id },
                { reload: true }
              );
            },
            error => {
              this.processing = false;
              this.messageHandler.showError(
                'There was a problem finalising the Data Model.',
                error
              );
            }
          );
      });
    });
    return promise;
  }

  newVersion() {
    this.stateHandler.Go(
      'newVersionDataModel',
      { dataModelId: this.result.id },
      { location: true }
    );
  }

  compare(dataModel = null) {
    this.stateHandler.NewWindow(
      'modelscomparison',
      {
        sourceId: this.result.id,
        targetId: dataModel ? dataModel.id : null
      },
      null
    );
  }

  export(exporter) {
    this.exportError = null;
    this.processing = true;
    this.exportedFileIsReady = false;
    this.exportHandler.exportDataModel([this.result], exporter).subscribe(
      result => {
        if (result != null) {
          this.exportedFileIsReady = true;
          const label =
            [this.result].length === 1 ? [this.result][0].label : 'data_models';
          const fileName = this.exportHandler.createFileName(label, exporter);
          const file = new Blob([result.body], { type: exporter.fileType });
          const link = this.exportHandler.createBlobLink(file, fileName);

          this.processing = false;
          this.renderer.appendChild(this.aLink.nativeElement, link);
          // remove if any link exists
          // jQuery("#exportFileDownload a").remove();
          // jQuery("#exportFileDownload").append(jQuery(aLink)[0]);
        } else {
          this.processing = false;
          this.messageHandler.showError(
            'There was a problem exporting the Data Model.',
            ''
          );
        }
      },
      error => {
        this.processing = false;
        this.messageHandler.showError(
          'There was a problem exporting the Data Model.',
          error
        );
      }
    );
    // var promise = exportHandler.exportDataModel([$scope.mcModelObject], exporter);
    // promise.then(function (result) {
    //     $scope.exportedFileIsReady = true;
    //
    //     var aLink = exportHandler.createBlobLink(result.fileBlob, result.fileName);
    //     //remove if any link exists
    //     jQuery("#exportFileDownload a").remove();
    //     jQuery("#exportFileDownload").append(jQuery(aLink)[0]);
    //
    //     $scope.processing = false;
    // },function(response){
    //     $scope.processing = false;
    //     //error in saving!!
    //     console.log(response);
    //     $scope.exportError = "An error occurred when processing the request.";
    // });
  }

  loadExporterList() {
    this.exportList = [];
    this.securityHandler.isValidSession().subscribe(result => {
      if (result === false) {
        return;
      }
      this.resourcesService.public.dataModelExporterPlugins().subscribe(
        res => {
          this.exportList = res.body;
        },
        error => {
          this.messageHandler.showError(
            'There was a problem loading exporters list.',
            error
          );
        }
      );
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
}
