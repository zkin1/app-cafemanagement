// src/app/app.module.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { DatabaseService } from './services/database.service';
import { DatabaseServiceMock } from './mocks/database.service.mock';
import { SQLiteMock } from './mocks/sqlite.mock';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

export const testModuleConfig = {
  imports: [
    IonicModule.forRoot(),
    FormsModule,
    RouterTestingModule
  ],
  providers: [
    { provide: SQLite, useClass: SQLiteMock },
    { provide: DatabaseService, useClass: DatabaseServiceMock }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
};