import { Component, OnInit } from '@angular/core';
import { SecurityHandlerService } from '../../services/handlers/security-handler.service';
import { ForgotPasswordModalComponent } from '../forgot-password-modal/forgot-password-modal.component';
import { ResourcesService } from '../../services/resources.service';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoginModalComponent } from '../login-modal/login-modal.component';

@Component({
  selector: 'mdm-register-modal',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.sass']
})
export class RegisterModalComponent implements OnInit {
  email: any;
  firstName: any;
  lastName: any;
  organisation: any;
  roleInOrganisation: any;
  password: any;
  confirmPassword: any;
  message: any;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RegisterModalComponent>,
    private securityHandler: SecurityHandlerService,
    private resources: ResourcesService
  ) {}

  ngOnInit() {
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.organisation = '';
    this.roleInOrganisation = '';
    this.password = '';
    this.confirmPassword = '';
  }

  disabled = () => {
    return (this.email === '' || this.firstName === '' || this.lastName === '' || this.password === '' || this.password !== this.confirmPassword);
  };

  register = () => {
    const resource = {
      emailAddress: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      organisation: this.organisation,
      roleInOrganisation: this.roleInOrganisation,
      password: this.password,
      confirmPassword: this.confirmPassword
    };
    this.resources.catalogueUser.post(null, null, { resource }).subscribe(
      result => {
        this.dialogRef.close();
        this.registerSuccess();
      },
      error => {
        let firstError: string = error.error.errors[0].message;

        if (firstError.indexOf('Property [emailAddress] of class [class ox.softeng.metadatacatalogue.core.user.CatalogueUser] with value') >= 0 &&
          firstError.indexOf('must be unique') >= 0
        ) {
          firstError = `The email address ${this.email} has already been registered.`;
        }

        this.message = 'Error in registration: ' + firstError;
      }
    );
  };

  registerSuccess = () => {
    const dialog = this.dialog.open(ConfirmationModalComponent, {
      hasBackdrop: true,
      data: {
        title: 'Registration successful',
        message: `You have successfully requested access to the Metadata Catalogue.
                  You will receive an email (to ${this.email}) containing login details once an administrator has approved your request.`,
        cancelShown: false
      }
    });

    dialog.afterClosed().subscribe(result => {
      if (result.status !== 'ok') {
        // reject("cancelled");
      }
    });
  };

  keyEntered = event => {
    if (event.which === 13) {
      this.register();
    }
  };

  login = () => {
    this.dialogRef.close();
    this.dialog.open(LoginModalComponent);
  }
}