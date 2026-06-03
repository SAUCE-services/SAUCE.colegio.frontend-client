import { HttpInterceptorFn } from '@angular/common/http';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  // Aquí definimos la API KEY. En producción, esto podría venir de un environment.ts
  const apiKey = 'sauce-secret-key-2026'; 

  const authReq = req.clone({
    setHeaders: {
      'X-API-KEY': apiKey
    }
  });

  return next(authReq);
};
