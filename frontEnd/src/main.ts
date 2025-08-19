import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './app/interceptors/token.interceptor';
import { authErrorInterceptor } from './app/interceptors/auth-error.interceptor';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideHttpClient(withInterceptors([tokenInterceptor, authErrorInterceptor])),
  ],
}).catch((err) => console.error(err));
