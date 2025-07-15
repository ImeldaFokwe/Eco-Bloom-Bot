import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    // URL statique pour le backend
    private apiUrl = 'http://localhost:5002/login';

    constructor(private http: HttpClient) { }

    login(credentials: { email: string; password: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials);
    }
}