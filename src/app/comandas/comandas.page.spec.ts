import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComandasPage } from './comandas.page';

describe('ComandasPage', () => {
  let component: ComandasPage;
  let fixture: ComponentFixture<ComandasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ComandasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
