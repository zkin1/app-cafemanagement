import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleMeetingPage } from './schedule-meeting.page';

describe('ScheduleMeetingPage', () => {
  let component: ScheduleMeetingPage;
  let fixture: ComponentFixture<ScheduleMeetingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleMeetingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
