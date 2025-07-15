import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import nécessaire pour utiliser *ngFor
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [CommonModule, HttpClientModule, NavigationComponent],
})
export class SettingsComponent implements OnInit {

  intensity: number = 0;

  actuatorStatus = {
    fan: { status: 'off', mode: 'auto' },
    light: { status: 'off', mode: 'auto' },
    pump: { status: 'off', mode: 'auto' },
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadActuatorStatus();
  }

  onSliderInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.intensity = Number(value);
  
    // Send new intensity to backend
    this.http.post('http://localhost:5002/actuators/api/actuator/intensity', {
      actuator: 'light',
      intensity: this.intensity,
    }).subscribe(
      (response: any) => {
        console.log("Intensity updated:", response);
      },
      (error) => {
        console.error("Failed to update intensity:", error);
      }
    );
  }

  setIntensity(newVal: number): void {
    this.intensity = newVal;
  }

  loadActuatorStatus(): void {
    this.http
      .get('http://localhost:5002/actuators/api/actuator/status')
      .subscribe(
        (response: any) => {
          this.actuatorStatus = response.reduce((acc: any, actuator: any) => {
            acc[actuator.actuator] = {
              status: actuator.status,
              mode: actuator.mode,
            };

            if (actuator.actuator === 'light' && actuator.intensity !== undefined) {
              this.intensity = actuator.intensity;
            }

            return acc;
          }, {});
        },
        (error) => {
          console.error('Error loading actuator statuses:', error);
        }
      );
  }

  onModeChange(actuator: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const mode = isChecked ? 'manual' : 'auto';
    this.setMode(actuator, mode);
  }

  onStatusChange(actuator: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const action = isChecked ? 'start' : 'stop';
    this.controlActuator(actuator, action);
  }

  setMode(actuator: string, mode: string): void {
    this.http
      .post(`http://localhost:5002/actuators/api/actuator/mode`, {
        actuator,
        mode,
      })
      .subscribe(
        (response: any) => {
          console.log(`${actuator} mode updated to ${mode}:`, response);
          this.actuatorStatus[actuator].mode = mode;
        },
        (error) => {
          console.error(`Error updating mode for ${actuator}:`, error);
        }
      );
  }

  controlActuator(actuator: string, action: string): void {
    this.http
      .post(`http://localhost:5002/actuators/api/actuator/control`, {
        actuator,
        action,
      })
      .subscribe(
        (response: any) => {
          console.log(`${actuator} action executed: ${action}`);
          this.actuatorStatus[actuator].status =
            action === 'start' ? 'on' : 'off';
        },
        (error) => {
          console.error(
            `Error executing action ${action} for ${actuator}:`,
            error
          );
        }
      );
  }
}
