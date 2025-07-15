import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraViewerComponent } from './camera-viewer.component';

describe('CameraViewerComponent', () => {
  let component: CameraViewerComponent;
  let fixture: ComponentFixture<CameraViewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CameraViewerComponent]
    });
    fixture = TestBed.createComponent(CameraViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
