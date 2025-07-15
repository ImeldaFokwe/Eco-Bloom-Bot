import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/login.component';

@NgModule({
    declarations: [],
    imports: [BrowserModule, ReactiveFormsModule, LoginComponent],
    providers: [],
    bootstrap: [LoginComponent],
})
export class AppModule { }
