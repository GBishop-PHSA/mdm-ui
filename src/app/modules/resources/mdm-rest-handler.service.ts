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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IMdmRestHandler } from '@maurodatamapper/mdm-resources';
import { BroadcastService } from '@mdm/services/broadcast.service';
import { StateHandlerService } from '@mdm/services/handlers/state-handler.service';
import { MessageService } from '@mdm/services/message.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * An IMdmRestHandler implemented using Angular's HttpClient.
 */
@Injectable()
export class MdmRestHandlerService implements IMdmRestHandler {
    constructor(private messageService: MessageService, private http: HttpClient, private broadcastSvc: BroadcastService, private stateHandler: StateHandlerService) { }

    process(url: string, options: any) {
        if (options.withCredentials === undefined ||
            options.withCredentials === null ||
            (options.withCredentials !== undefined && options.withCredentials === false)) {
            throw new Error('withCredentials is not provided!');
        }

        if (options.responseType) { } else {
            options.responseType = undefined;
        }

        options.headers = options.headers || {};
        // STOP IE11 from Caching HTTP GET
        options.headers['Cache-Control'] = 'no-cache';
        options.headers.Pragma = 'no-cache';


        return this.http.request(options.method, url, {
            body: options.data,
            headers: options.headers,
            withCredentials: options.withCredentials,
            observe: 'response',
            responseType: options.responseType
        }).pipe(
          catchError(response => {
            if (response.status === 0 || response.status === -1) {
                this.stateHandler.ApplicationOffline();
                this.broadcastSvc.broadcast('applicationOffline', response);
            } else if (response.status === 401) {
                this.messageService.lastError = response;
                if (options.login === undefined) {
                this.stateHandler.NotAuthorized(response); }
            } else if (response.status === 404) {
                this.messageService.lastError = response;
                this.stateHandler.NotFound(response);
            } else if (response.status === 501) {
                this.messageService.lastError = response;
                this.stateHandler.NotImplemented(response);
            } else if (response.status >= 400 && response.status < 500 && options.method === 'GET') {
                this.messageService.lastError = response;
                this.stateHandler.NotFound(response);
                // this.broadcastSvc.broadcast('resourceNotFound', response);
            } else if (response.status >= 500) {
                this.messageService.lastError = response;
                this.stateHandler.ServerError(response);
            }
            return throwError(response);
          })
        );
  }
}