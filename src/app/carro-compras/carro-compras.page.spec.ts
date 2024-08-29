import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarroComprasPage } from './carro-compras.page';

describe('CarroComprasPage', () => {
  let component: CarroComprasPage;
  let fixture: ComponentFixture<CarroComprasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CarroComprasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
