import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {DataModelResult} from '../../model/dataModelModel';
import {DataClassResult} from '../../model/dataClassModel';

@Component({
  selector: 'mdm-element-alias',
  templateUrl: './element-alias.component.html',
  // styleUrls: ['./element-alias.component.sass']
})
export class ElementAliasComponent implements OnInit {
  @Input() aliases: any[] = [];
  @Input() editableForm: any;
  @Input() property: string;
  @Input() element: DataClassResult;
  typedAlias: string;
  @Input() inEditMode: false;
  @ViewChild('typedAliasId', {static: false}) alias: ElementRef;

  constructor() {
  }

  ngOnInit() {

  }

  remove(element) {
    const index = this.aliases.findIndex(alias => alias === element);
    if (index !== -1) {
      this.aliases.splice(index, 1);
      this.editableForm.aliases = this.aliases;
    }

  }


  add() {
    if (this.typedAlias.trim() === '') {
      return;
    }
    if (this.aliases) {
      for (const element of this.aliases) {
        if (element === this.typedAlias) {
          return;
        }
      }
    } else {
      this.aliases = [];
    }
    this.aliases.push(this.typedAlias);
    // this.editableForm["aliases"] = this.aliases;
    this.editableForm.aliases = this.aliases;

    this.typedAlias = '';
    this.alias.nativeElement.focus();
  }

  keyup = function(event) {
    if (event.keyCode && event.keyCode === 13) {
      this.add();
    }
    event.preventDefault();
    return false;
  };


}