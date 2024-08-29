import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeManagementPage } from './employee-management.page';

describe('EmployeeManagementPage', () => {
  let component: EmployeeManagementPage;
  let fixture: ComponentFixture<EmployeeManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
