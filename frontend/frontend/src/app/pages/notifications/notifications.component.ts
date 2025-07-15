import { Component } from '@angular/core';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';
import {FormsModule} from '@angular/forms';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [NavigationComponent, FormsModule],
  template: `<app-navigation />`,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
  email: string;
  subject: string;
  message: string;

  constructor(private emailService: EmailService) {}

  onSubmit() {
    this.emailService
      .sendEmail(this.email, this.subject, this.message)
      .subscribe(
        (response) => {
          console.log('Email sent successfully!');
        },
        (error) => {
          console.log('Error sending email:', error);
        }
      );
  }
}
