/*
Copyright 2020-2023 University of Oxford and NHS England

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
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TermRelationshipsComponent } from './term-relationships.component';
import { McPagedListComponent } from '../mc-paged-list/mc-paged-list.component';
import { ElementLinkComponent } from '../element-link/element-link.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MdmResourcesService } from '@mdm/modules/resources';
import { MatDialogModule } from '@angular/material/dialog';

describe('TermRelationshipsComponent', () => {
  let component: TermRelationshipsComponent;
  let fixture: ComponentFixture<TermRelationshipsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatTooltipModule
      ],
      providers: [
        {
          provide: MdmResourcesService, useValue: {}
        }
      ],
      declarations: [
        McPagedListComponent,
        ElementLinkComponent,
        TermRelationshipsComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TermRelationshipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
