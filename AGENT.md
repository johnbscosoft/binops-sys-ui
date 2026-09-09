# Agent Guide — WasteOps UI

## Project

This repository contains the WasteOps/BinOps Angular UI. It uses Angular 21, TypeScript, Bootstrap/Velzon styling, SweetAlert2 notifications, and an Nginx production container.

## Structure

```text
src/app/pages/             Feature pages and services
src/app/layouts/           Shell, navigation, header, and footer
src/environments/          Local and production environment settings
nginx/                     Nginx reverse-proxy configuration
Dockerfile                 Production UI image
compose.yaml               Production Compose deployment
compose.test.yaml          Test-environment Compose deployment
.github/workflows/         CI and Docker Hub image publishing
```

## UI conventions

- Use Angular templates and TypeScript with strict null-safe handling.
- Use SweetAlert2 for success, error, warning, confirmation, and delete messages; do not introduce browser `alert()` or `confirm()`.
- Mark required form fields with a red asterisk and keep client-side validation aligned with the API schema.
- Phone number fields must accept digits only and require exactly 10 digits. Use `inputmode="numeric"`, `maxlength="10"`, a 10-digit pattern, inline validation, and sanitize pasted non-digit characters.
- Use the existing horizontal action dropdown pattern in data tables.
- Keep forms responsive, scrollable inside modals, and accessible with labels and keyboard actions.
- Reuse existing services and environment API URLs. Do not hard-code production hosts in components.
- Preserve existing user changes and avoid unrelated formatting rewrites.
- For reference-data dropdowns, use the quick-add pattern: include an `Add New …` option that opens a right-side offcanvas form.
- After a quick-add succeeds, update or reload the dropdown data, automatically select the new record, and reload dependent values. For example, a newly created Apartment/Property is selected immediately and its rooms are fetched for the Room dropdown.
- The quick-add form must collect every field required by the API, use SweetAlert2 for outcomes, and lock the parent form while its offcanvas is open.

## API integration

- API calls belong in feature services, not directly in components.
- Keep request and response interfaces aligned with the backend schema.
- Handle API failures with actionable SweetAlert2 messages and preserve retry behaviour where it exists.
- Do not place access tokens, passwords, Docker Hub credentials, or API secrets in source files.

## Validation

Run from the repository root before handoff:

```bash
npm ci
npm run build -- --configuration production
npm test -- --watch=false --browsers=ChromeHeadless
docker compose -f compose.yaml config
docker compose -f compose.test.yaml config
```

## Deployment

- Production image tag: `ui-latest` or a pinned `ui-YYYYMMDD-HHMMSS` tag.
- Test image tag: `ui-test-latest` or a pinned datetime tag.
- The UI container listens on port 80 internally and is exposed only on loopback by Compose; Caddy is responsible for public HTTPS reverse proxying.
- Docker builds stamp `BUILD_VERSION` into the production UI footer and image label. Keep that flow intact when editing Docker or CI configuration.
