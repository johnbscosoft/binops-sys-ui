import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthApiService } from '../../auth-api.service';

@Component({
    selector: 'app-cover',
    templateUrl: './cover.component.html',
    styleUrls: ['./cover.component.scss'],
    standalone: false
})

/**
 * Cover Component
 */
export class CoverComponent implements OnInit {

 // Login Form
 passresetForm!: UntypedFormGroup;
 submitted = false;
 fieldTextType!: boolean;
 error = '';
 success = '';
 isLoading = false;
 returnUrl!: string;
 // set the current year
 year: number = new Date().getFullYear();
 // Carousel navigation arrow show
 showNavigationArrows: any;

 constructor(private formBuilder: UntypedFormBuilder, private authApi: AuthApiService) { }

 ngOnInit(): void {
   /**
    * Form Validatyion
    */
    this.passresetForm = this.formBuilder.group({
     email: ['', [Validators.required, Validators.email]]
   });
 }

 // convenience getter for easy access to form fields
 get f() { return this.passresetForm.controls; }

 /**
  * Form submit
  */
  onSubmit() {
   this.submitted = true;

   // stop here if form is invalid
   if (this.passresetForm.invalid) {
     return;
   }
   this.isLoading = true;
   this.error = '';
   this.success = '';
   this.authApi.forgotPassword(this.f['email'].value.trim()).subscribe({
     next: (response) => {
       this.success = response.message;
       this.isLoading = false;
     },
     error: (error: Error) => {
       this.error = error.message || 'Password reset request failed';
       this.isLoading = false;
     }
   });
 }
}
