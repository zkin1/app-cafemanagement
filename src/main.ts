import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

if (!Capacitor.isNativePlatform()) {
  jeepSqlite(window);
}