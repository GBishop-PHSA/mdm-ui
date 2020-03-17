import {
  Component,
  AfterViewInit,
  Input,
  OnChanges,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import {ResourcesService} from '../../services/resources.service';
import {SecurityHandlerService} from '../../services/handlers/security-handler.service';
import {MessageHandlerService} from '../../services/utility/message-handler.service';
import {HelpDialogueHandlerService} from '../../services/helpDialogue.service';
import {merge, Observable, BehaviorSubject} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatInput} from '@angular/material/input';
import {DialogPosition} from '@angular/material/dialog';


@Component({
  selector: 'mdm-data-set-metadata',
  templateUrl: './mc-data-set-metadata.component.html',
  styleUrls: ['./mc-data-set-metadata.component.scss']
})
export class McDataSetMetadataComponent implements AfterViewInit {

  @Input() parent: any;
  @Input() type: any;
  @Input() metaDataItems: any;
  @Input() loadingData: any;
  @Input() clientSide: any;
  @Input() afterSave: any;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChildren('filters') filters: QueryList<MatInput>;

  namespaces: any[];
  metadataKeys: any[];
  access: any;
  loading = false;
  records: any[];
  metadata: any;
  displayedColumns: string[] = ['namespace', 'key', 'value', 'btns'];
  hideFilters = true;
  totalItemCount: number;
  isLoadingResults: boolean;
  filterEvent = new EventEmitter<string>();
  filter: string;


  constructor(private resources: ResourcesService,
              private securityHandler: SecurityHandlerService,
              private messageHandler: MessageHandlerService,
              private helpService: HelpDialogueHandlerService,
              private changeDetectorRefs: ChangeDetectorRef) {

  }

  ngAfterViewInit() {

    if (this.parent) {
      this.namespaces = [];
      this.metadataKeys = [];
      this.records = [];

      this.access = this.securityHandler.elementAccess(this.parent);
      this.changeDetectorRefs.detectChanges();


      if (this.type === 'dynamic') {

        this.resources.metadata.namespaces.get().toPromise().then((result) => {
          this.namespaces = result.body.filter((n) => n.defaultNamespace);


          this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
          this.filterEvent.subscribe(() => this.paginator.pageIndex = 0);
          merge(this.sort.sortChange, this.paginator.page, this.filterEvent)
            .pipe(
              startWith({}),
              switchMap(() => {
                  this.isLoadingResults = true;
                  this.changeDetectorRefs.detectChanges();

                  return this.metadataFetch(this.paginator.pageSize,
                    this.paginator.pageIndex,
                    this.sort.active,
                    this.sort.direction,
                    this.filter);
                }
              ),
              map((data: any) => {
                this.totalItemCount = data.body.count;
                this.isLoadingResults = false;
                this.changeDetectorRefs.detectChanges();
                return data.body.items;
              }),
              catchError(() => {
                this.isLoadingResults = false;
                this.changeDetectorRefs.detectChanges();
                return [];
              })
            ).subscribe(data => {
            this.records = data;
          });
        });
      }

      if (this.type === 'static') {
        this.loading = true;

        this.loadNamespaces();
        this.loadingData.onChange((newValue, oldValue, scope) => {
          if (newValue !== null && newValue !== undefined) {
            this.loading = newValue;
          }
        });
        this.metaDataItems.onChange((newValue, oldValue, scope) => {
          if (newValue !== null && newValue !== undefined) {
            this.showRecords();
          }
        });

      }
    }
  }

  loadNamespaces() {
    this.resources.metadata.namespaces.get().toPromise().then((result) => {
      this.namespaces = result.body.filter((n) => {
        return n.defaultNamespace;
      });
    });
  }


  metadataFetch(pageSize?, pageIndex?, sortBy?, sortType?, filters?) {

    const options = {
      pageSize,
      pageIndex,
      sortBy,
      sortType,
      filters
    };

    if (options.filters) {
      if (options.filters.indexOf('namespace') !== -1) {
        options.filters = options.filters.replace('namespace', 'ns');
      }
    }
    return this.resources.facets.get(this.parent.id, 'metadata', options);
  }

  applyFilter = () => {
    let filter: any = '';
    this.filters.forEach((x: any) => {
      const name = x.nativeElement.name;
      const value = x.nativeElement.value;

      if (value !== '') {
        filter += name + '=' + value;
      }
    });
    this.filter = filter;
    this.filterEvent.emit(filter);
  };

  onNamespaceSelect(select, record) {

    if (select) {
      record.edit.namespace = select.namespace;
      record.metadataKeys = [];
      // now fill the 'metadataKeys'
      for (const namespace of this.namespaces) {
        if (namespace.namespace === select.namespace) {
          record.metadataKeys = namespace.keys;
          // create object for the keys as mcSelect2 expects objects with id
          let id = 0;
          record.metadataKeys = namespace.keys.map((key) => {
            return {id: id++, key};
          });
          break;
        }
      }
    } else {
      record.edit.namespace = '';
      record.metadataKeys = [];
    }
  }

  onKeySelect(select, record) {
    if (select) {
      record.edit.key = select.key;
      // it is one of the default namespaces
      if (select.id !== -1) {

      }
    } else {
      record.edit.key = '';
    }
  }

  onEdit(record, index) {
    // now fill the 'metadataKeys'
    for (const namespace of this.namespaces) {
      if (namespace.namespace === record.namespace) {
        record.metadataKeys = namespace.metadataKeys;
        break;
      }
    }
  }

  showRecords() {
    if (this.metadata) {
      this.records = [].concat(this.metadata);
    }
  }

  validate = (record, index) => {
    let isValid = true;

    record.edit.errors = [];

    if (this.type === 'static') {
      if (record.edit.key.trim().length === 0) {
        record.edit.errors.key = 'Key can\'t be empty!';
        isValid = false;
      }
      if (record.edit.value.trim().length === 0) {
        record.edit.errors.value = 'Value can\'t be empty!';
        isValid = false;
      }
      for (let i = 0; i < this.records.length; i++) {
        if (i === index) {
          continue;
        }
        if (this.records[i].key.toLowerCase().trim() === record.edit.key.toLowerCase().trim() &&
          this.records[i].namespace.toLowerCase().trim() === record.edit.namespace.toLowerCase().trim()) {
          record.edit.errors.key = 'Key already exists';
          isValid = false;
        }
      }
      if (isValid) {
        delete record.edit.errors;
      }
    } else {
      if (record.edit.key.trim().length === 0) {
        record.edit.errors.key = 'Key can\'t be empty!';
        isValid = false;
      }
      if (record.edit.value.trim().length === 0) {
        record.edit.errors.value = 'Value can\'t be empty!';
        isValid = false;
      }
      // Call a backend service and see if it's duplicate
    }
    return isValid;
  };

  add() {
    const newRecord = {
      id: '',
      namespace: '',
      key: '',
      value: '',
      edit: {
        id: '',
        namespace: '',
        key: '',
        value: ''
      },
      inEdit: true,
      isNew: true
    };


    this.records = [].concat([newRecord]).concat(this.records);
  }

  cancelEdit(record, index) {
    if (record.isNew) {
      this.records.splice(index, 1);
      this.records = [].concat(this.records);
    }
  }

  save(record, index) {

    const resource = {
      key: record.edit.key,
      value: record.edit.value,
      namespace: record.edit.namespace
    };

    // if clientSide is true, it should not pass details to the server
    // this is used in wizard for adding metadata items when creating a new model,class or element
    if (this.clientSide) {
      record.namespace = resource.namespace;
      record.key = resource.key;
      record.value = resource.value;
      record.inEdit = false;
      record.isNew = false;
      this.records[index] = record;
      this.metaDataItems = this.records;
      return;
    }

    // in edit mode, we save them here
    if (record.id && record.id !== '') {
      this.resources.facets.put(this.parent.id, 'metadata', record.id, {resource})
        .subscribe((result) => {
            if (this.afterSave) {
              this.afterSave(resource);
            }

            record.namespace = resource.namespace;
            record.key = resource.key;
            record.value = resource.value;
            record.inEdit = false;
            this.messageHandler.showSuccess('Property updated successfully.');
          },
          (error) => {
            // duplicate namespace + key
            if (error.status === 422) {
              record.edit.errors = [];
              record.edit.errors.key = 'Key already exists';
              return;
            }
            this.messageHandler.showError('There was a problem updating the property.', error);
          });
    } else {
      this.resources.facets.post(this.parent.id, 'metadata', {resource}).subscribe((response) => {
        // after successfully saving the row, it if is a new row,then remove its newRow property
        record.id = response.body.id;
        record.namespace = response.body.namespace;
        record.key = response.key;
        record.value = response.value;
        record.inEdit = false;
        delete record.edit;

        if (this.type === 'static') {
          this.records[index] = record;
          this.messageHandler.showSuccess('Property saved successfully.');
        } else {
          this.records[index] = record;
          this.messageHandler.showSuccess('Property saved successfully.');
          this.filterEvent.emit();
        }
      }, (error) => {
        // duplicate namespace + key
        if (error.status === 422) {
          record.edit.errors = [];
          record.edit.errors.key = 'Key already exists';
          return;
        }
        this.messageHandler.showError('There was a problem saving property.', error);
      });
    }
  }

  delete(record, $index) {
    if (this.clientSide) {
      this.records.splice($index, 1);
      this.metaDataItems = this.records;
      return;
    }
    this.resources.facets.delete(this.parent.id, 'metadata', record.id)
      .subscribe(() => {
        if (this.type === 'static') {
          this.records.splice($index, 1);
          this.messageHandler.showSuccess('Property deleted successfully.');
        } else {
          this.records.splice($index, 1);
          this.messageHandler.showSuccess('Property deleted successfully.');
          this.filterEvent.emit();
        }
      }, (error) => {
        this.messageHandler.showError('There was a problem deleting the property.', error);
      });
  }

  loadHelp = function(event) {
    this.helpService.open('Editing_properties', 'right' as DialogPosition);
  };


  filterClick() {
    this.hideFilters = !this.hideFilters;
  }


}