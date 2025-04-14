import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

const bootstrap = () => bootstrapApplication(AppComponent, appConfig);

export default bootstrap;
