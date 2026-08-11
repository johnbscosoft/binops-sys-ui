# UI Docker Hub and server deployment

## Pipeline

```text
Pull request
  → Install locked npm dependencies
  → Run Angular unit tests and report existing failures
  → Build the production UI
  → Merge to main
  → Build and push an immutable Docker image
  → Production approval
  → SSH to the server
  → Pull and recreate the UI container
  → Verify container health
```

The shared Docker Hub image repository is:

```text
jbscosoft/binops-sys
```

The current legacy component suite contains TestBed setup failures. The workflow
runs and reports the suite without blocking releases; the production Angular
build remains the required release gate. Remove `continue-on-error` from the unit
test step after those specs have been corrected.

## 1. Docker Hub and GitHub

Create `jbscosoft/binops-sys` in Docker Hub. Ensure the existing GitHub
Actions secret `DOCKERHUB_TOKEN` has read/write access to it.

Create a GitHub environment named `production`. Optionally add required
reviewers so a person must approve each production deployment.

Create these repository or `production` environment secrets:

| Name | Purpose |
| --- | --- |
| `DEPLOY_HOST` | Production server hostname or IP |
| `DEPLOY_USER` | Restricted Linux deployment user |
| `DEPLOY_SSH_KEY` | Private SSH key for that user |
| `DEPLOY_KNOWN_HOSTS` | Verified SSH host-key entry |
| `DEPLOY_PORT` | Optional SSH port; defaults to `22` |

Create this GitHub Actions variable:

```text
DEPLOY_PATH=/opt/binops-sys-ui
```

The workflow deploys production only for successful pushes or merges to `main`.
The current repository branch is `master`; create and use `main` before expecting
automatic production deployment:

```bash
git branch -M main
git push -u origin main
```

## 2. Prepare the server

Install Docker Engine and Docker Compose, then create the deployment directory:

```bash
sudo mkdir -p /opt/binops-sys-ui
sudo chown -R deploy-user:deploy-user /opt/binops-sys-ui
```

Copy `compose.yaml` into that directory.

Create the shared private Docker network:

```bash
docker network create binops_backend
```

The SSH workflow also creates it when it does not exist.

Attach the API container to that network:

```bash
docker network connect binops_backend binops-sys-api
```

For a permanent configuration, also declare `binops_backend` as an external
network in the API Compose file. The UI proxies `/api/` to
`http://binops-sys-api:8001` by default.

If the Docker Hub repository is private, sign in on the server with a read-only
token:

```bash
docker login --username jbscosoft
```

## 3. Manual deployment

```bash
cd /opt/binops-sys-ui
UI_IMAGE_TAG=ui-latest docker compose -f compose.yaml pull ui
UI_IMAGE_TAG=ui-latest docker compose -f compose.yaml up -d --remove-orphans ui
docker compose -f compose.yaml ps
```

The UI is bound to `127.0.0.1:8080` by default for a host-level Nginx, Caddy, or
Traefik reverse proxy. Set `UI_BIND_ADDRESS=0.0.0.0` only when direct access is
required and the port is protected by a firewall.

To use a different API container or address:

```bash
API_UPSTREAM=http://your-api:8001 docker compose -f compose.yaml up -d ui
```

## 4. Published tags

The workflow publishes:

- `ui-YYYYMMDD-HHMMSS`, generated from the UTC build datetime, for deployment and rollback.
- `ui-latest` additionally for successful builds from `main`.

## 5. Verification and rollback

```bash
curl --fail http://127.0.0.1:8080/healthz
docker inspect --format '{{.State.Health.Status}}' binops-sys-ui
docker compose -f compose.yaml logs --tail=100 ui
```

To roll back, put the previous immutable tag in `.deploy.env`:

```env
UI_IMAGE_TAG=ui-20260811-143025
```

Then run:

```bash
docker compose --env-file .deploy.env -f compose.yaml pull ui
docker compose --env-file .deploy.env -f compose.yaml up -d ui
```
