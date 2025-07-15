import { Component, Injectable, OnDestroy, OnInit } from '@angular/core';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';
import Chart from 'chart.js/auto';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    NavigationComponent,
    NgClass],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
})
@Injectable({
  providedIn: 'root',
})
export class HomepageComponent implements OnInit, OnDestroy {
  private url = 'http://localhost:5002/sensors/api/data';
  id: any;
  TSL2561!: Chart;
  SoilMoisture!: Chart;
  BME280_Temperature!: Chart;
  BME280_Humidity!: Chart;
  BME280_Pressure!: Chart;
  HC_SR04_Distance!: Chart;
  plantScore: number = 0;
  plantHealthScoreChart!: Chart;

  // Track the latest timestamp (in ms) for each sensor type
  private lastTimestamps: { [sensor: string]: number } = {};

  constructor(private http: HttpClient) { }

  // Helper function to format the timestamp into HH:mm:ss
  private shortenLabel(value: string): string {
    try {
      const date = new Date(value);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      console.warn('Invalid timestamp:', value, error);
      return value;
    }
  }

  private fetchPlantScore(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for score request.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>('http://localhost:5002/api/plant/score', { headers }).subscribe(
      (response) => {
        this.plantScore = response.total_score;
      },
      (error) => {
        console.error('Error fetching plant score:', error);
      }
    );
  }

  private fetchScoreHistory(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for score history.');
      return;
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>('http://localhost:5002/api/plant/score/history', { headers }).subscribe(
      (data) => {
        console.log('History data:', data);
        data.forEach((entry) => {
          this.addData(this.plantHealthScoreChart, entry.timestamp, entry.score);
        });
      },
      (error) => {
        console.error('Error fetching score history:', error);
      }
    );
  }

  // Add a new data point to the chart and maintain a rolling window of 20
  private addData(chart: Chart, label: string, newData: number): void {
    const formattedLabel = this.shortenLabel(label);
    chart.data.labels.push(formattedLabel);
    chart.data.datasets.forEach((dataset) => {
      dataset.data.push(newData);
    });

    // Keep only the last 10 data points
    if (chart.data.labels.length > 10) {
      chart.data.labels.shift();
      chart.data.datasets.forEach((dataset) => {
        dataset.data.shift();
      });
    }
    chart.update();
  }

  // Process each sensor data entry and update the corresponding chart.
  // Only add if the new reading is more recent than the last one for that sensor.
  private sortData(object: { sensor_type: string; timestamp: string; value: number }): void {
    const sensor = object.sensor_type;
    const newTime = new Date(object.timestamp).getTime();

    // If we already have a timestamp for this sensor and the new one is not newer, skip it.
    if (this.lastTimestamps[sensor] && newTime <= this.lastTimestamps[sensor]) {
      return;
    }
    // Save the new timestamp
    this.lastTimestamps[sensor] = newTime;

    // Use the timestamp from the DB as the label
    const time = object.timestamp;
    switch (sensor) {
      case 'TSL2561':
        this.addData(this.TSL2561, time, object.value);
        break;
      case 'SoilMoisture':
        this.addData(this.SoilMoisture, time, object.value);
        break;
      case 'BME280_Temperature':
        this.addData(this.BME280_Temperature, time, object.value);
        break;
      case 'BME280_Humidity':
        this.addData(this.BME280_Humidity, time, object.value);
        break;
      case 'BME280_Pressure':
        this.addData(this.BME280_Pressure, time, object.value);
        break;
      case 'HC_SR04_Distance':
        this.addData(this.HC_SR04_Distance, time, object.value);
        break;
      default:
        console.warn(`Unknown sensor type: ${sensor}`);
    }
  }

  // Fetch new data from the server
  private getData(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in local storage.');
      return;
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(this.url, { headers }).subscribe(
      (dataArray) => {
        dataArray.forEach((data) => {
          // Expecting data.timestamp and data.value
          if (data.timestamp && data.value !== undefined) {
            this.sortData(data);
          } else {
            console.warn('Invalid data point:', data);
          }
        });
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }

  // Initialize the component and charts
  ngOnInit(): void {
    const configureChart = (canvasId: string, label: string): Chart => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) {
        console.error(`Canvas with ID "${canvasId}" not found.`);
        throw new Error(`Canvas with ID "${canvasId}" not found.`);
      }
      return new Chart(canvas.getContext('2d')!, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label,
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: false,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: 'Time' },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: label },
            },
          },
        },
      });
    };

    // Initialize empty charts using the canvas IDs defined in the HTML
    this.TSL2561 = configureChart('light', 'Light Intensity (lux)');
    this.SoilMoisture = configureChart('soilMoisture', 'Soil Moisture (value)');
    this.BME280_Temperature = configureChart('temperature', 'Temperature (°C)');
    this.BME280_Humidity = configureChart('humidity', 'Humidity (%)');
    this.BME280_Pressure = configureChart('pressure', 'Pressure (hPa)');
    this.HC_SR04_Distance = configureChart('distance', 'Distance (cm)');
    this.plantHealthScoreChart = configureChart('plantHealthScoreChart', 'Health Score (0-10)');

    // Fetch data every 2 seconds
    this.fetchPlantScore();
    this.fetchScoreHistory();
    this.id = setInterval(() => {
      this.getData();
      this.fetchPlantScore(); // Optional: refresh score too
    }, 2000);
  }

  // Cleanup when component is destroyed
  ngOnDestroy(): void {
    if (this.id) {
      clearInterval(this.id);
    }
  }
}