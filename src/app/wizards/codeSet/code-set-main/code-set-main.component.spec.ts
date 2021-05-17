/*
Copyright 2020-2021 University of Oxford
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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeSetMainComponent } from './code-set-main.component';
import { StateService } from '@uirouter/core';
import { UIRouterModule } from '@uirouter/angular';
import { ToastrModule } from 'ngx-toastr';
import { MdmResourcesService } from '@mdm/modules/resources';
import { empty } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ElementClassificationsComponent } from '@mdm/utility/element-classifications/element-classifications.component';
import { MatSelectModule } from '@angular/material/select';
import { ElementLinkComponent } from '@mdm/utility/element-link/element-link.component';
import { MultipleTermsSelectorComponent } from '@mdm/utility/multiple-terms-selector/multiple-terms-selector.component';
import { MatTableModule } from '@angular/material/table';
import { McSelectComponent } from '@mdm/utility/mc-select/mc-select.component';

describe('CodeSetMainComponent', () => {
  let component: CodeSetMainComponent;
  let fixture: ComponentFixture<CodeSetMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        UIRouterModule.forRoot({ useHash: true }),
        ToastrModule.forRoot(),
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatButtonModule,
        MatSelectModule,
        MatTableModule
      ],
      providers: [
        {
          provide: StateService,
          useValue: {
            params: {}
          }
        },
        {
          provide: MdmResourcesService,
          useValue: {
            // tslint:disable-next-line: deprecation
            folder: { get: () => empty() },
            // tslint:disable-next-line: deprecation
            classifier: { list: () => empty() },
            // tslint:disable-next-line: deprecation
            terminology: { list: () => empty() }
          }
        },
      ],
      declarations: [
        CodeSetMainComponent,
        ElementClassificationsComponent,
        ElementLinkComponent,
        MultipleTermsSelectorComponent,
        McSelectComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeSetMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
