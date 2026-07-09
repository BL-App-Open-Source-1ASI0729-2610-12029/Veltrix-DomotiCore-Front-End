import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AUTH_TOKEN_KEY, ACTIVE_SEGMENT_KEY } from '../../iam/infrastructure/auth-api-endpoint';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const segment = localStorage.getItem(ACTIVE_SEGMENT_KEY);
    const apiBase = environment.apiUrl?.replace(/\/$/, '');

    if (!token || !apiBase || !req.url.startsWith(apiBase)) {
      return next.handle(req);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (segment === 'smart-home' || segment === 'small-business') {
      headers['X-DomotiCore-Segment'] = segment;
    }

    return next.handle(
      req.clone({
        setHeaders: headers,
      }),
    );
  }
}
