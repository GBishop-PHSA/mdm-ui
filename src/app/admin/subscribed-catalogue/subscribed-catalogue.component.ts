/*
Copyright 2020-2023 University of Oxford
and Health and Social Care Information Centre, also known as NHS Digital

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
import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {
  MdmResponse,
  SubscribedCatalogue,
  SubscribedCatalogueResponse,
  Uuid
} from '@maurodatamapper/mdm-resources';
import {MdmResourcesService} from '@mdm/modules/resources';
import {
  MessageHandlerService,
  SharedService,
  StateHandlerService
} from '@mdm/services';
import {EditingService} from '@mdm/services/editing.service';
import {UIRouterGlobals} from '@uirouter/core';
import {EMPTY, forkJoin, Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'mdm-subscribed-catalogue',
  templateUrl: './subscribed-catalogue.component.html',
  styleUrls: ['./subscribed-catalogue.component.scss']
})
export class SubscribedCatalogueComponent implements OnInit {
  readonly noAuthAuthenticationType: string = 'No Authentication';
  readonly apiKeyAuthenticationType: string = 'API Key';
  readonly oAuthClientCredentialsAuthenticationType: string = 'OAuth (Client Credentials)';
  readonly supportedAuthenticationTypes: string[] = [this.noAuthAuthenticationType, this.apiKeyAuthenticationType, this.oAuthClientCredentialsAuthenticationType];

  catalogueId?: Uuid;
  connectionTypes: string[] = [];
  authenticationTypes: string[] = [];

  isCreating: boolean;

  formGroup: FormGroup;

  constructor(
    private resources: MdmResourcesService,
    private routerGobals: UIRouterGlobals,
    private stateHandler: StateHandlerService,
    private shared: SharedService,
    private messageHandler: MessageHandlerService,
    private title: Title,
    private editingService: EditingService
  ) {
    this.createFormGroup();
  }

  get label() {
    return this.formGroup.get('label');
  }

  get description() {
    return this.formGroup.get('description');
  }

  get url() {
    return this.formGroup.get('url');
  }

  get type() {
    return this.formGroup.get('type');
  }

  get authenticationType() {
    return this.formGroup.get('authenticationType');
  }

  get apiKey() {
    return this.formGroup.get('apiKey');
  }

  get tokenUrl() {
    return this.formGroup.get('tokenUrl');
  }

  get clientId() {
    return this.formGroup.get('clientId');
  }

  get clientSecret() {
    return this.formGroup.get('clientSecret');
  }

  get refreshPeriod() {
    return this.formGroup.get('refreshPeriod');
  }

  get catalogueRequest(): SubscribedCatalogue {
    const baseRequest = {
      id: this.catalogueId,
      label: this.label.value,
      description: this.description.value,
      url: this.url.value,
      subscribedCatalogueType: this.type.value,
      subscribedCatalogueAuthenticationType: this.authenticationType.value,
      refreshPeriod: this.refreshPeriod.value
    };
    if (this.authenticationType.value === this.noAuthAuthenticationType) {
      return baseRequest;
    } else if (this.authenticationType.value === this.apiKeyAuthenticationType) {
      return {...baseRequest, ...{apiKey: this.apiKey.value}};
    } else if (this.authenticationType.value === this.oAuthClientCredentialsAuthenticationType) {
      return {
        ...baseRequest, ...{
          tokenUrl: this.tokenUrl.value,
          clientId: this.clientId.value,
          clientSecret: this.clientSecret.value,
        }
      };
    }
  }

  ngOnInit(): void {
    if (!this.shared.features.useSubscribedCatalogues) {
      this.stateHandler.Go('alldatamodel');
      return;
    }

    this.editingService.start();
    this.catalogueId = this.routerGobals.params.id;

    forkJoin([
      this.resources.subscribedCatalogues.types(),
      this.resources.subscribedCatalogues.authenticationTypes()
    ])
      .pipe(
        switchMap(([typesResponse, authenticationTypesResponse]: MdmResponse<string[]>[]) => {
          this.connectionTypes = typesResponse.body;
          this.authenticationTypes = this.supportedAuthenticationTypes.filter(authType => authenticationTypesResponse.body.includes(authType));

          if (this.catalogueId) {
            this.isCreating = false;
            this.title.setTitle('Subscribed Catalogue - Edit Subscription');

            return this.resources.admin
              .getSubscribedCatalogue(this.catalogueId)
              .pipe(
                map(
                  (cataloguesResponse: SubscribedCatalogueResponse) =>
                    cataloguesResponse.body
                )
              );
          }

          this.isCreating = true;
          this.title.setTitle('Subscribed Catalogue - Add Subscription');
          return of({
            label: '',
            url: ''
          });
        }),
        catchError((error) => {
          this.messageHandler.showError(
            'Unable to get the subscribed catalogue.',
            error
          );
          this.navigateToParent();
          return EMPTY;
        })
      )
      .subscribe((catalogue: SubscribedCatalogue) => {
        this.createFormGroup(catalogue);
      });
  }

  save() {
    if (this.formGroup.invalid) {
      return;
    }

    const request$: Observable<SubscribedCatalogueResponse> = this.isCreating
      ? this.resources.admin.saveSubscribedCatalogues(this.catalogueRequest)
      : this.resources.admin.updateSubscribedCatalogue(
        this.catalogueId,
        this.catalogueRequest
      );

    request$
      .pipe(
        catchError((error) => {
          this.messageHandler.showError(
            `There was a problem ${
              this.isCreating ? 'saving' : 'updating'
            } the subscribed catalogue.`,
            error
          );
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.messageHandler.showSuccess(
          `Subscribed catalogue ${
            this.isCreating ? 'saved' : 'updated'
          } successfully.`
        );
        this.navigateToParent();
      });
  }

  cancel() {
    this.editingService.confirmCancelAsync().subscribe((confirm) => {
      if (confirm) {
        this.navigateToParent();
      }
    });
  }

  private createFormGroup(catalogue?: SubscribedCatalogue) {
    this.formGroup = new FormGroup({
      label: new FormControl(catalogue?.label, [Validators.required]), // eslint-disable-line @typescript-eslint/unbound-method
      description: new FormControl(catalogue?.description),
      url: new FormControl(catalogue?.url, [Validators.required]), // eslint-disable-line @typescript-eslint/unbound-method
      type: new FormControl(catalogue?.subscribedCatalogueType, [
        Validators.required // eslint-disable-line @typescript-eslint/unbound-method
      ]),
      authenticationType: new FormControl(catalogue?.subscribedCatalogueAuthenticationType, [
        Validators.required // eslint-disable-line @typescript-eslint/unbound-method
      ]),
      apiKey: new FormControl(catalogue?.apiKey),
      tokenUrl: new FormControl(catalogue?.tokenUrl),
      clientId: new FormControl(catalogue?.clientId),
      clientSecret: new FormControl(catalogue?.clientSecret),
      refreshPeriod: new FormControl(catalogue?.refreshPeriod)
    });
  }

  private navigateToParent() {
    this.editingService.stop();
    this.stateHandler.Go('appContainer.adminArea.subscribedCatalogues');
  }
}
