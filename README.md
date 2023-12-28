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

- `LETSENCRYPT_DOMAIN`: The domain for which to request a Let's Encrypt certificate.

- `LETSENCRYPT_EMAIL`: The email address to use when requesting a Let's Encrypt certificate.

### Starting the Application

To start the application, run the following command:

```sh
npm start
```

This starts the Express server on port 3000.

### Docker Deployment

The application can also be deployed using Docker. The provided [`Dockerfile`](./Dockerfile) and [`docker-compose.yaml`](./docker-compose.yaml) files can be used to build and run the application as a Docker container. The Traefik Reverse Proxy uses DNS-01 Challenge to create a TLS certificate. The API is exposed via TLS on port 9999.

To build and start the Docker container, run the following command:

```sh
docker-compose up --build
```

## Usage

```
curl https://HOST:9999/update-dns?ipAddress=`curl http://ipecho.net/plain`&zoneId=somehetznerzoneid&recordName=somehost&apiToken=sometoken
```

NOTE: to get the zone ids in hetzner consult hetzner documentation. On time of writing you can use the following curl:

```
curl "https://dns.hetzner.com/api/v1/zones" \
     -H "Auth-API-Token: ${HETZNER_API_TOKEN}" | jq
```
