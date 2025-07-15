import { Routes } from '@angular/router';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { CameraViewerComponent } from './pages/camera-viewer/camera-viewer.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { PagenotfoundComponent } from './pages/pagenotfound/pagenotfound.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'homepage',
    component: HomepageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'camera',
    component: CameraViewerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', component: PagenotfoundComponent },
];
