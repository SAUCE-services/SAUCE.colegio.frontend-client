# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-02

### Added
- **Docker deployment:** Multi-stage `Dockerfile` with Node 22 Alpine build stage and Nginx Alpine runtime stage, with auto-generated self-signed SSL certificate (`Dockerfile`, `nginx.conf`)
- **Nginx reverse proxy:** Production-grade configuration with SSL termination (TLS 1.2/1.3), reverse proxy `/api/` → `core-service:8081`, SPA routing fallback, gzip compression, cache control headers, and HTTP→HTTPS redirect (`nginx.conf`)
- **API key interceptor:** HTTP interceptor that adds `X-API-KEY` header to all outgoing requests (`src/app/interceptors/api-key.interceptor.ts`)
- **Interceptor registration:** `apiKeyInterceptor` wired into `appConfig` providers via `withInterceptors` (`src/app/app.config.ts`)

### Changed
- **API base URL:** Migrated from hardcoded `http://localhost:8081` to proxy-relative `/api`, enabling unified routing through Nginx in production (`src/app/services/colegio-serv.ts:30`)
- **Budget limits:** Increased component style budget limits from 4kB/8kB to 10kB/20kB (warning/error) to accommodate real-world component sizes (`angular.json:47-48`)

### Removed
- **SSR support:** Removed Angular SSR configuration (`server`, `outputMode`, `security`, `ssr` blocks) from build options in `angular.json`. The application now runs as a pure client-side SPA served by Nginx
