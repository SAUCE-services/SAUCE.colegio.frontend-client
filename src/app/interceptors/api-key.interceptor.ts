import { HttpInterceptorFn } from '@angular/common/http';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  // El placeholder será reemplazado por el script de entrada del contenedor
  const apiKey = 'API_KEY_PLACEHOLDER'; 

  const authReq = req.clone({
    setHeaders: {
      'X-API-KEY': apiKey
    }
  });

  return next(authReq);
};
