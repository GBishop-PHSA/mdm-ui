/*
Copyright 2021 University of Oxford

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

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MdmResourcesService } from '@mdm/modules/resources';
import {
  StateHandlerService,
  ValidatorService,
  MessageHandlerService
} from '@mdm/services';
import { UIRouterGlobals } from '@uirouter/core';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'mdm-new-version-reference-data-model',
  templateUrl: './new-version-reference-data-model.component.html',
  styleUrls: ['./new-version-reference-data-model.component.sass']
})
export class NewVersionReferenceDataModelComponent implements OnInit {
  step = 1;
  referenceDataModel: any;
  errors: { label: string } | undefined;
  versionType: 'Fork' | 'Branch' | 'Version' | undefined;
  processing: boolean;
  form = {
    label: '',
    copyPermissions: false,
    copyDataFlows: false,
    moveDataFlows: false
  };
  constructor(
    private uiRouterGlobals: UIRouterGlobals,
    private stateHandler: StateHandlerService,
    private resources: MdmResourcesService,
    private validator: ValidatorService,
    private messageHandler: MessageHandlerService,
    private title: Title
  ) {}

  ngOnInit() {
    this.title.setTitle('New Data Model Version');

    if (!this.uiRouterGlobals.params.referenceDataModelId) {
      this.stateHandler.NotFound({ location: false });
      return;
    }

    this.resources.referenceDataModel
      .get(this.uiRouterGlobals.params.referenceDataModelId)
      .subscribe((response) => {
        this.referenceDataModel = response.body;
      });
  }

  versionTypeChecked() {
    this.step++;
  }

  validate() {
    this.errors = null;
    if (!this.versionType) {
      return false;
    }
    if (this.versionType === 'Fork') {
      if (this.validator.isEmpty(this.form.label)) {
        this.errors = this.errors || undefined;
        this.errors.label = 'Data Model name can not be empty!';
      } else if (
        this.form.label.trim().toLowerCase() ===
        this.referenceDataModel.label.trim().toLowerCase()
      ) {
        this.errors = this.errors || undefined;
        this.errors.label = `The name should be different from the current version name ${this.referenceDataModel.label}`;
      }
    }
    if (this.versionType === 'Branch') {
      if (this.validator.isEmpty(this.form.label)) {
        this.errors = this.errors || undefined;
        this.errors.label = 'Branch name can not be empty!';
      }
    }
    return !this.errors;
  }

  save() {
    if (!this.validate()) {
      return;
    }
    if (this.versionType === 'Fork') {
      const resource = {
        label: this.form.label,
        copyPermissions: this.form.copyPermissions,
        copyDataFlows: this.form.copyDataFlows
      };
      this.processing = true;

      this.resources.referenceDataModel
        .newForkModel(this.referenceDataModel.id, resource)
        .pipe(finalize(() => (this.processing = false)))
        .subscribe(
          (response) => {
            this.messageHandler.showSuccess(
              'New Data Model version created successfully.'
            );
            this.stateHandler.Go(
              'datamodel',
              { id: response.body.id },
              { reload: true }
            );
          },
          (error) => {
            this.processing = false;
            this.messageHandler.showError(
              'There was a problem creating the new Data Model version.',
              error
            );
          }
        );
    } else if (this.versionType === 'Version') {
      this.processing = true;
      this.resources.referenceDataModel
        .newBranchModelVersion(this.referenceDataModel.id, {})
        .subscribe(
          (response) => {
            this.processing = false;
            this.messageHandler.showSuccess(
              'New Document Model version created successfully.'
            );
            this.stateHandler.Go(
              'referenceDataModel',
              { id: response.body.id },
              { reload: true }
            );
          },
          (error) => {
            this.processing = false;
            this.messageHandler.showError(
              'There was a problem creating the new Document Model version.',
              error
            );
          }
        );
    } else if (this.versionType === 'Branch') {
      let resources = {};
      if (this.form.label !== null && this.form.label !== '') {
        resources = { branchName: this.form.label };
      }

      this.processing = true;
      this.resources.referenceDataModel
        .newBranchModelVersion(this.referenceDataModel.id, resources)
        .subscribe(
          (response) => {
            this.processing = false;
            this.messageHandler.showSuccess('New Branch created successfully.');
            this.stateHandler.Go(
              'referenceDataModel',
              { id: response.body.id },
              { reload: true }
            );
          },
          (error) => {
            this.processing = false;
            this.messageHandler.showError(
              'There was a problem creating the new Document Model version.',
              error
            );
          }
        );
    }
  }

  cancel = () => {
    this.stateHandler.Go('referenceDataModel', {
      id: this.referenceDataModel.id
    });
  };
}