import { Component, OnInit } from '@angular/core';
import { StateService } from '@uirouter/core';
import { StateHandlerService } from '../../services/handlers/state-handler.service';
import { ResourcesService } from '../../services/resources.service';
import { MessageHandlerService } from '../../services/utility/message-handler.service';
import { ConfigurationPropertiesResult } from '../../model/ConfigurationProperties';
import { from } from 'rxjs';
import { PropertyRenamingService } from '../../services/utility/property-renaming.service';
import { ObjectEnhancerService } from '../../services/utility/object-enhancer.service';

@Component({
  selector: 'mdm-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.sass']
})
export class ConfigurationComponent implements OnInit {
  propertiesTemp: any;
  properties: ConfigurationPropertiesResult;
  oldConfiguration: ConfigurationPropertiesResult;
  activeTab: any;
  resource: any;
  indexingStatus: string;
  indexingTime: string;

  constructor(
    private resourcesService: ResourcesService,
    private messageHandler: MessageHandlerService,
    private stateService: StateService,
    private stateHandler: StateHandlerService,
    private propertyRenamingService: PropertyRenamingService,
    private objectEnhancer: ObjectEnhancerService
  ) {}

  ngOnInit() {
    this.getConfig();
    this.activeTab = this.getTabDetailByName(this.stateService.params.tabView);

    this.indexingStatus = '';
  }

  getConfig() {
    this.resourcesService.admin
      .get('properties', null)
      .subscribe((result: { body: any }) => {
        this.properties = result.body;
        // this.propertiesTemp = this.propertyRenamingService.renameKeys(result.body);
        // this.properties = this.propertiesTemp;

        this.oldConfiguration = Object.assign({}, this.properties);
      },
      err => {
        this.messageHandler.showError(
          'There was a problem getting the configuration properties.',
          err
        );
      });
  }

  // Create or edit a configuration property
  Submit() {
    this.resource = this.objectEnhancer.diff(
      this.properties,
      this.oldConfiguration
    );

    const call = from(
      this.resourcesService.admin.post('editProperties', {
        resource: this.resource
      })
    ).subscribe(
      result => {
        this.messageHandler.showSuccess(
          'Configuration properties updated successfully.'
        );

        // refresh the page
        this.getConfig();
      },
      error => {
        this.messageHandler.showError(
          'There was a problem updating the configuration properties.',
          error
        );
      }
    );
  }

  tabSelected(itemsName) {
    const tab = this.getTabDetail(itemsName);
    this.stateHandler.Go(
      'configuration',
      { tabView: tab.name },
      { notify: false, location: tab.index !== 0 }
    );
  }

  getTabDetail(tabIndex) {
    switch (tabIndex) {
      case 0:
        return { index: 0, name: 'email' };
      case 1:
        return { index: 1, name: 'lucene' };
      default:
        return { index: 0, name: 'email' };
    }
  }

  getTabDetailByName(tabName) {
    switch (tabName) {
      case 'email':
        return { index: 0, name: 'email' };
      case 'lucene':
        return { index: 1, name: 'lucene' };
      default:
        return { index: 0, name: 'email' };
    }
  }

  rebuildIndex() {
    this.indexingStatus = 'start';

    this.resourcesService.admin.post('rebuildLuceneIndexes', null).subscribe(
      result => {
        this.indexingStatus = 'success';
      },
      error => {
        if (error.status === 418) {
          this.indexingStatus = 'success';
          // console.log("error.timeTaken");

          if (error.error && error.error.timeTaken) {
            this.indexingTime = 'in ' + error.error.timeTaken;
          }
        } else {
          this.indexingStatus = 'error';
        }
      }
    );
  }
}