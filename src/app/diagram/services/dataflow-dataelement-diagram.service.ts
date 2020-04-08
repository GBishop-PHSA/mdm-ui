import { BasicDiagramService } from './basic-diagram.service';
import { forkJoin, Observable, pipe } from 'rxjs';
import * as joint from 'jointjs';
import { flatMap, map } from 'rxjs/operators';
import { forEach } from '@uirouter/core';


export class DataflowDataelementDiagramService extends BasicDiagramService {

  classes: object = {};
  dataFlows: any = {};

  parentId: string;
  flowId: string;

  getDiagramContent(params: any): Observable<any> {
    this.parentId = params.parent.id;
    this.flowId = params.flowId;
    const classGetters = [];
    return (this.resourcesService.dataFlow.getFlowComponents(params.parent.id, params.flowId, params.flowComponentId) as Observable<any>).pipe(
      flatMap(data => {
        this.dataFlows = data.body;
        data.body.items.forEach((dataFlowComponent) => {
          dataFlowComponent.sourceElements.forEach((element) => {
            this.classes[element.dataClass] = element.breadcrumbs;
          });
          dataFlowComponent.targetElements.forEach((element) => {
            this.classes[element.dataClass] = element.breadcrumbs;
          });
        });
        const options = {sort: 'label', order: 'asc', all: true};
        Object.keys(this.classes).forEach((classId) => {
          const dataModelId: string = this.classes[classId][0].id;
          let parentClassId: string = null;
          if (this.classes[classId].length > 2) {
            parentClassId = this.classes[classId][this.classes[classId].length - 2].id;
          }
          classGetters.push(
            this.resourcesService.dataClass.get(dataModelId, null, classId, 'dataElements', options)
          );
        });
        return forkJoin(classGetters);
      })
    );

  }

  render(result: any): void {
    // console.log(result);
    const classAttributes: object = {};
    Object.keys(this.classes).forEach((classId) => {
      const classBreadcrumb = this.classes[classId][this.classes[classId].length - 1];
      const attributes: Array<any> = [];
      result.forEach((elementResponse: any) => {
        elementResponse.body.items.forEach((element) => {
          if (element.dataClass === classId) {
            attributes.push(element);
          }
        });
      });
      classAttributes[classId] = attributes;
      // this.addUmlClassCell(classBreadcrumb.id, classBreadcrumb.label, attributes);
      this.addRectangleCell(classBreadcrumb.id, classBreadcrumb.label, 300, attributes.length * 25 + 31);
    });

    this.dataFlows.items.forEach((flowComponent) => {

      this.addSmallRectangleCell(flowComponent.id, flowComponent.label);

      flowComponent.sourceElements.forEach((sourceElement) => {
        // console.log(sourceElement);
        const link1 = new joint.shapes.standard.Link({
          id: sourceElement.id + '/' + flowComponent.id,
          source: {
            // id: sourceElement.id,
            id: sourceElement.dataClass,
            /*anchor: {
              name: 'right'
            }*/
          },
          target: {
            id: flowComponent.id,
            /*anchor: {
              name: 'left'
            }*/
          }
        });
        link1.connector('rounded', {radius: 40});
        this.graph.addCell(link1);
      });
      flowComponent.targetElements.forEach((targetElement) => {
        const link2 = new joint.shapes.standard.Link({
          id: targetElement.id + '/' + flowComponent.id,
          source: {
            id: flowComponent.id,
            /*anchor: {
              name: 'right'
            }*/
          },
          target: {
            id: targetElement.dataClass,
            /*anchor: {
              name: 'left'
            }*/
          }
        });
        link2.connector('rounded', {radius: 40});
        this.graph.addCell(link2);
      });
    });
    // console.log('about to layout nodes');
    super.layoutNodes();

    // Now we place the UML cells in the correct places, and add all the links.
    Object.keys(classAttributes).forEach((classId) => {
      const rectCell: joint.dia.Element = this.graph.getCell(classId) as joint.dia.Element;
      const oldPosition = rectCell.position();
      this.graph.removeCells([rectCell]);

      // console.log((this.graph.getCell(classId) as joint.dia.Element).position());
      const umlClassCell = this.addUmlClassCell(rectCell.id as string, rectCell.attr('label/text'), classAttributes[classId], new joint.g.Point({
        x: oldPosition.x,
        y: oldPosition.y
      }), null);
      // umlClassCell.set('position');
    });

    this.dataFlows.items.forEach((flowComponent) => {

      this.addSmallRectangleCell(flowComponent.id, flowComponent.label);

      flowComponent.sourceElements.forEach((sourceElement) => {
        // console.log(sourceElement);
        const link1 = new joint.shapes.standard.Link({
          id: sourceElement.id + '/' + flowComponent.id,
          source: {
            id: sourceElement.id,
            // id: sourceElement.dataClass,
            anchor: {
              name: 'right'
            }
          },
          target: {
            id: flowComponent.id,
            anchor: {
              name: 'left'
            }
          }
        });
        link1.connector('rounded', {radius: 40});
        this.graph.addCell(link1);
      });
      flowComponent.targetElements.forEach((targetElement) => {
        const link2 = new joint.shapes.standard.Link({
          id: targetElement.id + '/' + flowComponent.id,
          source: {
            id: flowComponent.id,
            anchor: {
              name: 'right'
            }
          },
          target: {
            id: targetElement.id,
            anchor: {
              name: 'left'
            }
          }
        });
        link2.connector('rounded', {radius: 40});
        this.graph.addCell(link2);
      });
    });
    // console.log('added new uml boxes');
  }

  configurePaper(paper: joint.dia.Paper): void {
    paper.on('link:pointerdblclick', (cellView: joint.dia.CellView, event) => {
      // this.flowComponentId = cellView.model.attributes.source.id as string;
      // this.drawDiagram();
      // console.log(cellView.model.attributes.source.id as string);
      // console.log(this);


    });

  }

  layoutNodes(): void {
    // console.log('not calling super');
  }

  canGoUp(): boolean {
    return true;
  }

  goUp(): void {
    const result: any = {
      flowId: this.flowId as string,
      parent: {
        id: this.parentId
      },
      newMode: 'dataflow-class'
    };
    // console.log(result);
    this.clickSubject.next(result);
    this.clickSubject.complete();
  }

}