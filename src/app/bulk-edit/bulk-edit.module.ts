import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkEditElementSelectComponent } from './bulk-edit-element-select/bulk-edit-element-select.component';
import { BulkEditProfileSelectComponent } from './bulk-edit-profile-select/bulk-edit-profile-select.component';
import { BulkEditEditorComponent } from './bulk-edit-editor/bulk-edit-editor.component';
import { AgGridModule } from 'ag-grid-angular';
import { BulkEditContainerComponent } from './bulk-edit-container/bulk-edit-container.component';
import { MaterialModule } from '@mdm/modules/material/material.module';
import { FormsModule } from '@angular/forms';
import { CheckboxCellRendererComponent } from './bulk-edit-editor/cell-renderers/checkbox-cell-renderer/checkbox-cell-renderer.component';
import { DateCellEditorComponent } from './bulk-edit-editor/cell-editors/date-cell-editor/date-cell-editor.component';
import { CalendarModule } from 'primeng/calendar';


@NgModule({
  declarations: [
    BulkEditElementSelectComponent,
    BulkEditProfileSelectComponent,
    BulkEditEditorComponent,
    BulkEditContainerComponent,
    CheckboxCellRendererComponent,
    DateCellEditorComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    CalendarModule,
    FormsModule,
    AgGridModule.withComponents([
      CheckboxCellRendererComponent,
      DateCellEditorComponent
    ])
  ],
  exports: [
    BulkEditElementSelectComponent,
    BulkEditProfileSelectComponent,
    BulkEditEditorComponent,
    BulkEditContainerComponent
  ]
})
export class BulkEditModule { }
