import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { ResourcesService } from '../resources.service';
import { StateHandlerService } from './state-handler.service';
import { ElementTypesService } from '../element-types.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecurityHandlerService {
  loginModalDisplayed = false;
  in_AuthLoginRequiredCheck = false;
  constructor(
    private elementTypes: ElementTypesService,
    private resources: ResourcesService,
    private cookies: CookieService,
    private stateHandler: StateHandlerService
  ) {}

  removeCookie() {
    this.cookies.delete('token');
    this.cookies.delete('userId');
    this.cookies.delete('firstName');
    this.cookies.delete('lastName');
    this.cookies.delete('username');
    this.cookies.delete('role');
    this.cookies.delete('needsToResetPassword');
    this.cookies.delete('userId');
  }

  getUserFromCookie() {
    if (
      this.cookies.get('username') &&
      this.cookies.get('username').length > 0
    ) {
      return {
        id: this.cookies.get('userId'),
        token: this.cookies.get('token'),
        username: this.cookies.get('username'),
        email: this.cookies.get('username'),
        firstName: this.cookies.get('firstName'),
        lastName: this.cookies.get('lastName'),
        role: this.cookies.get('role'),
        needsToResetPassword: this.cookies.get('needsToResetPassword')
      };
    }
    return null;
  }

  getEmailFromCookies() {
    return this.cookies.get('email');
  }

  addToCookie(user) {
    this.cookies.set('userId', user.id);
    this.cookies.set('token', user.token);
    this.cookies.set('firstName', user.firstName);
    this.cookies.set('lastName', user.lastName);
    this.cookies.set('username', user.username);
    this.cookies.set('userId', user.id);

    // Keep username for 100 days
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 100);
    this.cookies.set('email', user.username, expireDate);
    this.cookies.set('role', user.role);
    this.cookies.set('needsToResetPassword', user.needsToResetPassword);
  }

  login(username, password) {
    // //ignoreAuthModule: true
    // //This parameter is very important as we do not want to handle 401 if user credential is rejected on login modal form
    // //as if the user credentials are rejected Back end server will return 401, we should not show the login modal form again
    // var deferred = $q.defer();
    const resource = { username, password };

    const promise = new Promise((resolve, reject) => {
      this.resources.authentication
        .post(
          'login',
          { resource },
          { login: true, ignoreAuthModule: true, withCredentials: true }
        )
        .subscribe(
          res => {
            const result = res.body;
            const currentUser = {
              id: result.id,
              token: result.token,
              firstName: result.firstName,
              lastName: result.lastName,
              username: result.emailAddress,
              role: result.userRole ? result.userRole.toLowerCase() : '',
              needsToResetPassword: result.needsToResetPassword ? true : false
            };
            this.addToCookie(currentUser);
            return resolve(currentUser);
          },
          error => {
            return reject(error);
          }
        );
    });
    return promise;
  }

  //       login2(username, password) {
  //           var resource = {username:username,password:password};
  //           this.resources.authenticationPost("login", {resource:resource}, {login:true, ignoreAuthModule: true, withCredentials: true})
  //           // this.http.post(url)
  //               .map((res: Response)=>{
  //     console.log("res")
  // })
  // .catch((error:any)=>{
  //     // Observable.throw(error);
  //     console.log('login test fails')
  // })
  //       }

  logout() {
    return this.resources.authentication
      .post('logout', null, { responseType: 'text' })
      .subscribe(result => {
        this.removeCookie();
        this.stateHandler.Go('appContainer.mainApp.home');
      });
  }

  expireToken() {
    this.cookies.delete('token');
  }

  isValidSession() {
    return this.resources.authentication.get('isValidSession');
  }

  isLoggedIn() {
    return this.getUserFromCookie() != null;
  }

  isAdmin() {
    if (this.isLoggedIn()) {
      const user = this.getUserFromCookie();
      if (user.role === 'administrator') {
        return true;
      }
    }
    return false;
  }

  getCurrentUser() {
    return this.getUserFromCookie();
  }

  showIfRoleIsWritable(element) {
    // if this app is NOT 'editable', return false
    const isEditable = environment.appIsEditable;
    if (isEditable !== null && isEditable === false) {
      return false;
    } else if (isEditable !== null && isEditable /* === true*/) {
      // Now app is editable, lets check if the user has writable role
      const user = this.getCurrentUser();

      // if the user is not logged-in
      if (!user) {
        return false;
      }

      // because of circular dependencies between stateRoleAccess and SecurityHandler, we load it locally instead of injecting it
      // var stateRoleAccess: StateRoleAccessService = this.inject.get(StateRoleAccessService);

      // check if the user role is a writable one and return false if it is NOT
      // var allRoles = stateRoleAccess.getAllRoles();
      // if (user && user.role && allRoles[user.role]) {
      //    if (allRoles[user.role].writable === false) {
      //        return false;
      //    }
      // } else {
      //    return false;
      // }

      // if a value is provided, we need to check if the user has writable access to the element
      if (element) {
        if (element.editable && !element.finalised) {
          return true;
        }
        return false;
      }

      return true;
    }

    return false;
  }

  isCurrentSessionExpired() {
    const promise = new Promise(resolve => {
      // var deferred = $q.defer();
      if (this.getCurrentUser()) {
        // check session and see if it's still valid
        this.isValidSession().subscribe(response => {
          resolve(!response.body);
        });
      } else {
        resolve(false);
      }
    });

    return promise;
  }

  saveLatestURL(url) {
    this.cookies.set('latestURL', url);
  }
  getLatestURL() {
    return this.cookies.get('latestURL');
  }
  removeLatestURL() {
    this.cookies.delete('latestURL');
  }

  dataModelAccess(element) {
    return {
      showEdit: element.editable && !element.finalised,
      showNewVersion: element.editable && element.finalised,
      showFinalise: element.editable && !element.finalised,
      showPermission: element.editable || this.isAdmin(),
      showDelete: this.isAdmin(),
      canAddAnnotation: this.isLoggedIn(),
      canAddMetadata: this.isLoggedIn(),

      canAddLink: element.editable && !element.finalised
    };
  }

  termAccess(element) {
    return {
      showEdit: element.editable && !element.finalised,
      showNewVersion: element.editable && element.finalised,
      showFinalise: element.editable && !element.finalised,
      showPermission: element.editable || this.isAdmin(),
      showDelete: this.isAdmin(),
      canAddAnnotation: this.isLoggedIn(),
      canAddMetadata: this.isLoggedIn(),

      canAddLink: element.editable
    };
  }

  dataElementAccess(element) {
    return {
      showEdit: element.editable,
      showDelete: this.isAdmin(),
      canAddAnnotation: this.isLoggedIn(),
      canAddMetadata: this.isLoggedIn(),

      canAddLink: element.editable && !element.finalised
    };
  }

  dataClassAccess(element) {
    return {
      showEdit: element.editable,
      showDelete: this.isAdmin(),
      canAddAnnotation: this.isLoggedIn(),
      canAddMetadata: this.isLoggedIn(),

      canAddLink: element.editable && !element.finalised
    };
  }

  dataTypeAccess(element) {
    return {
      showEdit: element.editable,
      showDelete: this.isAdmin(),
      canAddAnnotation: this.isLoggedIn(),
      canAddMetadata: this.isLoggedIn(),

      canAddLink: element.editable && !element.finalised
    };
  }

  datFlowAccess(dataFlow) {
    return {
      showEdit: dataFlow.editable,
      canAddAnnotation: dataFlow.editable,
      canAddMetadata: this.isLoggedIn()
    };
  }

  elementAccess(element) {
    if (
      element.domainType === 'DataModel' ||
      element.domainType === 'Terminology' ||
      element.domainType === 'CodeSet'
    ) {
      return this.dataModelAccess(element);
    }

    if (element.domainType === 'Term') {
      return this.termAccess(element);
    }

    if (element.domainType === 'DataElement') {
      return this.dataElementAccess(element);
    }

    if (element.domainType === 'DataClass') {
      return this.dataClassAccess(element);
    }

    const dataTypes = this.elementTypes.getAllDataTypesMap();
    if (dataTypes[element.domainType]) {
      return this.dataTypeAccess(element);
    }

    if (element.domainType === 'DataFlow') {
      return this.datFlowAccess(element);
    }
  }

  folderAccess(folder) {
    return {
      showEdit: folder.editable,
      showPermission: folder.editable || this.isAdmin(),
      showDelete: this.isAdmin()
    };
  }

  // return factoryObject;
  // };
}