# WasteOps System UI

Angular UI packaged as a production Nginx container and published with Docker Compose.

Images are built and pushed directly from the local machine; GitHub Actions is not used.

## 1. Open the project

```bash
cd /Users/johnbaptistmuwuluzi/Documents/LABORA/PROJECTS/wasteops-sys-ui
```

## 2. Build the image

The default image is `jbscosoft/wasteops-sys-ui:latest` on Docker Hub.

```bash
docker compose build ui
```

To build another tag:

```bash
IMAGE_TAG=v1.0.0 docker compose build ui
```

## 3. Test locally

```bash
docker compose up -d ui
docker compose ps
```

Open `http://localhost:8080`, then stop it with:

```bash
docker compose down
```

## 4. Log in to Docker Hub

Create a Docker Hub access token and store it in your terminal without committing it:

```bash
export DOCKERHUB_TOKEN='YOUR_DOCKER_HUB_TOKEN'
echo "$DOCKERHUB_TOKEN" | docker login -u jbscosoft --password-stdin
```

## 5. Push the image

```bash
docker compose push ui
```

For a versioned image, use the same tag for both commands:

```bash
IMAGE_TAG=v1.0.0 docker compose build ui
IMAGE_TAG=v1.0.0 docker compose push ui
```

## 6. Pull and run on a server

```bash
docker login -u jbscosoft
docker pull jbscosoft/wasteops-sys-ui:latest
IMAGE_NAME=jbscosoft/wasteops-sys-ui IMAGE_TAG=latest APP_PORT=80 docker compose up -d --no-build ui
```

Use another registry by overriding `IMAGE_NAME`:

```bash
IMAGE_NAME=registry.example.com/team/wasteops-sys-ui IMAGE_TAG=v1.0.0 docker compose build ui
IMAGE_NAME=registry.example.com/team/wasteops-sys-ui IMAGE_TAG=v1.0.0 docker compose push ui
```
