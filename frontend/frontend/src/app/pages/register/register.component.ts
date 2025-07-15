import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { User } from '../../model/user';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Import Router and RouterModule

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    RouterModule  // Include RouterModule in imports
  ],
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string;

  constructor(private http: HttpClient, private router: Router) {
    this.registerForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      passwordConfirm: new FormControl('', Validators.required),
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      this.http.post('http://localhost:5002/auth/register', formData).subscribe(
        (response: any) => {
          alert(response.message);
          this.router.navigate(['/login']);
        },
        (error) => {
          this.errorMessage = error.error.message || 'Registration failed';
        }
      );
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}

