import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';
import { CommonModule } from '@angular/common'; 
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-camera-viewer',
  standalone: true,
  imports: [NavigationComponent, CommonModule],
  templateUrl: './camera-viewer.component.html',
  styleUrls: ['./camera-viewer.component.css'],
})
@Injectable({
  providedIn: 'root',
})
export class CameraViewerComponent implements OnInit, OnDestroy {
  private apiUrl = 'http://localhost:5002/camera/api/camera';
  public imageUrl: string | null = null;
  public timestamp: string | null = null;
  private subscription!: Subscription;

  //variables pour date et heure
  public date: string | null = null;
  public hour: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Poll the GET endpoint every 1 seconds to fetch the latest frame and timestamp
    this.subscription = interval(1000).subscribe(() => {
      this.fetchImage();
    });
  }

  fetchImage(): void {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Expecting a JSON response
    this.http.get(this.apiUrl, { headers, responseType: 'json' }).subscribe(
      (data: any) => {
        // Set the image URL with a Data URL prefix for JPEG images
        this.imageUrl = 'data:image/jpeg;base64,' + data.image;
        this.timestamp = data.timestamp;
        const dateObj = new Date(this.timestamp);
        this.date = dateObj.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
        this.hour = dateObj.toLocaleTimeString('en-GB'); // Format: HH:mm:ss (24-hour)
      },
      (error) => {
        console.error('Error fetching camera image:', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
