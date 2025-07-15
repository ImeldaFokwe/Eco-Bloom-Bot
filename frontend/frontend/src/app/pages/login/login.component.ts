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
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    RouterModule  // Include RouterModule in imports
  ],
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  userModel = new User('');
  reactiveForm: FormGroup;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.reactiveForm = new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

navigateToSignUp(): void {
  this.router.navigate(['/register']);
}


  OnFormSubmitted(): void {
    if (this.reactiveForm.valid) {
      const { email, password } = this.reactiveForm.value;

      this.http.post('http://localhost:5002/auth/login', { email, password }).subscribe(
        (response: any) => {
          // Handle successful response
          console.log(response);
          // Save the token (consider using a service for this)
          localStorage.setItem('token', response.token);
          // Navigate to homepage
          this.router.navigate(['/homepage']);
        },
        (error) => {
          // Handle error response
          console.error(error);
          alert(error.error.message || 'Login failed');
        }
      );
    } else {
      console.log('Form is invalid');
    }
  }
}
