# Hetzner DynDNS Proxy

This project hosts an API that can be utilized to update DNS records on Hetzner via an Express server.

### index.js

The [`index.js`](./index.js) file is the main entry point of our application. It starts an Express server and defines two endpoints:

- `POST /update-dns`: This endpoint expects a JSON body with the fields `ipAddress`, `zoneId`, `recordName`, and `apiToken`. It updates the DNS record for the specified zone and record name with the provided IP address.

- `GET /update-dns`: This endpoint expects the same parameters as the POST endpoint, but as query parameters in the URL.

The `handleDnsRequest` function is used to perform the actual DNS record update. It first verifies if the API token is valid, then performs the update.

### .env File

The application requires a [`.env`](./.env) file in the root directory of the project. This file should define the following environment variables:

- `HETZNER_API_KEY`: The API key for accessing the Hetzner DNS API.

- `API_TOKEN_ZONE_<apiToken>`: For each API token you want to use, you should define an environment variable that corresponds to the zone ID that the token can update. Replace `<apiToken>` with the actual API token. (Example: `API_TOKEN_ZONE_asdf=somezoneidfromhetzner``) leading to a request that requires apiToken=asdf&zoneId=somezoneidfromhetzner

- `API_TOKEN_ZONE_<apiToken>`: For each API token you want to use, you should define an environment variable that corresponds to the zone IDs that the token can update. Replace `<apiToken>` with the actual API token

- `LETSENCRYPT_DOMAIN`

- `LETSENCRYPT_EMAIL`

### Starting the Application

To start the application, run the following command:

```sh
npm start
```

This starts the Express server on port 3000.

### Docker Deployment

The application can also be deployed using Docker. The provided [`Dockerfile`](./Dockerfile) and [`docker-compose.yaml`](./docker-compose.yaml) files can be used to build and run the application as a Docker container. The Docker container exposes the application on port 3000.

To build and start the Docker container, run the following command:

```sh
docker-compose up --build
```

### Traefik Configuration

The application is configured to work with Traefik as a reverse proxy. The [`traefik.yml`](./traefik.yml) file contains the configuration for Traefik. The [`docker-compose.yaml`](./docker-compose.yaml) file includes labels for Traefik to route requests to the application.
