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
import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Editable } from '@mdm/model/editable-forms';
import { SubscribedCatalogue, SubscribedCatalogueForm } from '@mdm/model/subscribed-catalogue-model';
import { MdmResourcesService } from '@mdm/modules/resources';
import { MessageHandlerService } from '@mdm/services';

@Component({
  selector: 'mdm-subscribed-catalogue-detail',
  templateUrl: './subscribed-catalogue-detail.component.html',
  styleUrls: ['./subscribed-catalogue-detail.component.scss']
})
export class SubscribedCatalogueDetailComponent implements OnInit {

  @Input() subscribedCatalogue: SubscribedCatalogue;

  editable: Editable<SubscribedCatalogue, SubscribedCatalogueForm>;
  processing = false;

  constructor(
    private resources: MdmResourcesService,
    private messageHandler: MessageHandlerService,
    private title: Title) { }

  ngOnInit(): void {
    this.title.setTitle(`Subscribed Catalogue - ${this.subscribedCatalogue.label}`);

    this.editable = new Editable(
      this.subscribedCatalogue,
      new SubscribedCatalogueForm());
  }

  federate() {
    this.processing = true;
    this.resources.subscribedCatalogues
      .federate(this.subscribedCatalogue.id)
      .subscribe(
        () => {
          this.processing = false;
          this.messageHandler.showSuccess('Triggered federation of subscribed data models. Changes will occur momentarily.');
        },
        errors => {
          this.processing = false;
          this.messageHandler.showError('Unable to start federation of subscribed data models.', errors);
        });
  }
}
