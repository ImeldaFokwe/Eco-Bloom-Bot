import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private emailUrl = 'http://localhost:5002/send-email';

  constructor(private http: HttpClient) { }

  sendEmail(email: string, subject: string, message: string) {
    const data = {
      "to": email,
      "subject": subject,
      "text": message
    };
    return this.http.post(this.emailUrl, data);
  }

}