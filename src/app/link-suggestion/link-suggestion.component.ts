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
import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ViewChildren,
  ElementRef
} from '@angular/core';
import { ResourcesService } from '../services/resources.service';
import { ElementTypesService } from '../services/element-types.service';
import { SecurityHandlerService } from '../services/handlers/security-handler.service';
import { Title } from '@angular/platform-browser';
import { StateService } from '@uirouter/core';
import { MessageHandlerService } from '../services/utility/message-handler.service';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import {MdmPaginatorComponent} from '@mdm/shared/mdm-paginator/mdm-paginator';

@Component({
  selector: 'mdm-link-suggestion',
  templateUrl: './link-suggestion.component.html',
  styleUrls: ['./link-suggestion.component.scss']
})
export class LinkSuggestionComponent implements OnInit {
  @Input() sourceDataElementId: any;
  @Input() sourceDataClassId: any;
  @Input() sourceDataModelId: any;
  @Input() targetDataModelId: any;

  datasource = new MatTableDataSource();
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MdmPaginatorComponent, { static: true }) paginator: MdmPaginatorComponent;
  @ViewChildren('filters', { read: ElementRef }) filters: ElementRef[];

  @ViewChild(MatTable, { static: false }) table: MatTable<any>;

  doNotSuggest: any;

  model = {
    source: null,
    sourceLink: null,
    loadingSource: false,

    target: null,
    targetLink: null,
    loadingTarget: false,

    suggestions: [],
    processing: false,

    sourceEditable: true,
    successfullyAdded: 0,
    totalSuggestionLinks: 0,
    totalIgnoredLinks: 0
  };

  displayedColumns = ['source', 'target', 'buttons'];
  hideFilters: boolean;

  constructor(
    private securityHandler: SecurityHandlerService,
    private elementTypes: ElementTypesService,
    private resources: ResourcesService,
    private title: Title,
    private state: StateService,
    private messageHandler: MessageHandlerService
  ) {}

  ngOnInit() {
    this.title.setTitle('Link Suggestion');
    this.hideFilters = true;


    this.sourceDataModelId = this.sourceDataModelId
      ? this.sourceDataModelId
      : this.state.params.sourceDMId;
    this.sourceDataElementId = this.sourceDataElementId
      ? this.sourceDataElementId
      : this.state.params.sourceDEId;
    this.sourceDataClassId = this.sourceDataClassId
      ? this.sourceDataClassId
      : this.state.params.sourceDCId;
    this.targetDataModelId = this.targetDataModelId
      ? this.targetDataModelId
      : this.state.params.targetDMId;

    if (this.sourceDataElementId) {
      this.setSourceDataElement(this.sourceDataModelId, this.sourceDataClassId, this.sourceDataElementId);
    } else if (this.sourceDataModelId) {
      this.setSourceDataModel([{ id: this.sourceDataModelId }]);
    }

    if (this.targetDataModelId) {
      this.setTargetDataModel([{ id: this.targetDataModelId }]);
    }
  }

  onSourceSelect = dataModels => {
    this.model.suggestions = [];
    this.setSourceDataModel(dataModels);
  };

  setSourceDataModel = dataModels => {
    if (dataModels && dataModels.length > 0) {
      this.model.loadingSource = true;
      this.resources.dataModel.get(dataModels[0].id).subscribe(result => {
        const data = result.body;
        this.model.source = data;
        this.model.sourceLink = this.elementTypes.getLinkUrl(this.model.source);
        const access = this.securityHandler.dataModelAccess(this.model.source);
        this.model.sourceEditable = access.showEdit;
        this.model.loadingSource = false;
      });
    } else {
      this.model.sourceLink = null;
      this.model.source = null;
      this.model.sourceEditable = true;
    }
  };

  setSourceDataElement = (sourceDMId, sourceDCId, sourceDEId) => {
    this.model.loadingSource = true;
    this.resources.dataElement
      .get(sourceDMId, sourceDCId, sourceDEId, null, null)
      .subscribe(result => {
        const data = result.body;
        this.model.source = data;
        this.model.sourceLink = this.elementTypes.getLinkUrl(this.model.source);
        const access = this.securityHandler.dataModelAccess(this.model.source);
        this.model.sourceEditable = access.showEdit;
        this.model.loadingSource = false;
      });
  };

  onTargetSelect = dataModels => {
    this.model.suggestions = [];
    this.setTargetDataModel(dataModels);
  };

  setTargetDataModel = dataModels => {
    if (dataModels && dataModels.length > 0) {
      this.model.loadingTarget = true;
      this.resources.dataModel.get(dataModels[0].id).subscribe(result => {
        const data = result.body;
        this.model.target = data;
        this.model.targetLink = this.elementTypes.getLinkUrl(this.model.target);
        this.model.loadingTarget = false;
      });
    } else {
      this.model.targetLink = null;
      this.model.target = null;
    }
  };

  onTargetDateElementSelect = (suggestion, record) => {
    record.selectedTarget = suggestion;
    record.showMore = null;
  };

  approveSuggestion = suggest => {
    const resource = {
      target: { id: suggest.selectedTarget.dataElement.id },
      linkType: 'Refines'
    };

    const i = this.model.suggestions.indexOf(suggest);

    if (i >= 0) {
      this.model.suggestions[i].processing = true;
      // create the link and then remove it
      this.resources.catalogueItem
        .post(this.model.source.id, 'semanticLinks', { resource })
        .subscribe(() => {
            this.model.suggestions[i].processing = false;
            this.model.suggestions[i].success = true;
            this.model.successfullyAdded++;

            setTimeout(() => {
              // $scope.mcDisplayRecords[index].success = false;
              this.model.suggestions.splice(i, 1);
              this.table.renderRows();
            }, 300);
          },
          error => {
            this.model.suggestions[i].processing = false;
            this.model.suggestions[i].success = false;
            this.messageHandler.showError(
              'There was a problem saving link.',
              error
            );
          }
        );
    }
  };

  ignoreSuggestion = record => {
    this.model.totalIgnoredLinks++;
    const index = this.model.suggestions.indexOf(record);

    if (index >= 0) {
      this.model.suggestions[index].ignore = true;
      setTimeout(() => {
        this.model.suggestions.splice(index, 1);
        this.table.renderRows();
      }, 300);
    }
  };

  toggleShowMore = suggestion => {
    suggestion.showMore = !suggestion.showMore;
  };

  suggest = function() {
    this.model.processing = true;

    this.model.successfullyAdded = 0;
    this.model.totalSuggestionLinks = 0;
    this.model.totalIgnoredLinks = 0;

    if (this.model.source.domainType === 'DataModel') {
      this.resources.dataModel
        .get(this.model.source.id, 'suggestLinks/' + this.model.target.id)
        .subscribe(
          result => {
            const data = result.body;
            this.model.suggestions = data.links;
            this.model.totalSuggestionLinks = data.links.length;
            this.model.suggestions.forEach(suggestion => {
              suggestion.selectedTarget = suggestion.results[0];
            });
            this.datasource.data = data.links;
            this.datasource.paginator = this.paginator;
            this.datasource.sort = this.sort;
            this.model.processing = false;
          },
          () => {
            this.model.processing = false;
          }
        );
    } else if (this.model.source.domainType === 'DataElement') {
      this.resources.dataElement
        .get(
          this.model.source.dataModel,
          this.model.source.dataClass,
          this.model.source.id,
          'suggestLinks/' + this.model.target.id
        )
        .subscribe(
          data => {
            this.model.suggestions = [data];
            this.model.totalSuggestionLinks = 1;

            this.model.suggestions.forEach(suggestion => {
              suggestion.selectedTarget = suggestion.results[0];
            });
            this.datasource.data = [data];
            this.datasource.paginator = this.paginator;
            this.datasource.sort = this.sort;
            this.model.processing = false;
          },
          () => {
            this.model.processing = false;
          }
        );
    }
  };

  filterClick = () => {
    this.hideFilters = !this.hideFilters;
  }
}
