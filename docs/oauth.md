# Oauth

Eternal-Twin uses [the OAuth 2.0 authorization framework](https://tools.ietf.org/html/rfc6749) to expose its data to the game websites.
Each game website is an OAuth 2 client.

## Client creation

The first step is to create an OAuth client. It is not exposed publicly yet.

The creation options are:
- General information: display name, homepage URI
- Technical: OAuth redirect (callback) URI

The server creates the application and picks a random secret.
The secret is returned as clear-text in the creation response, it is never returned again.
The server treats the secret as a password and only stores its hash.

## Authorization request

To authenticate a user, the client must redirect the end user to Eternal-Twin to request its authorization.

The base URI is `https://eternal-twin.net/oauth/authorize`, with the following query parameters:

| Name         | Description                                                   |
|--------------|---------------------------------------------------------------|
| client_id    | **Required**. Client ID received during the client creation   |
| redirect_uri | Redirection URI. The default and only accepted value is the one configured during the app creation |
| login        | Not yet implement: username to use by default                 |
| scope        | Not yet implement: scopes to request                          |
| state        | A string returned as-is                                       |
| method       | Authentication method suggestion if the user needs to sign-in (etwin, twinoid, hammerfest). Default: `etwin` |

## Parameters

### State

The state parameter is a string returned as-is once the user has authenticated. It must include an unguessable part to prevent CSRF attacks.

For the system clients, we use a JWT based on [this RFC draft](https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00) for the state. In particular, it has a "Request Forgery Protection" (`rfp`) field.

### Redirect URI

Eternal-Twin does not allow dynamic redirect URIs. Use the `state` parameter to encode state.

For the system clients, we use `https://<game>/oauth/callback` if the client supports only one authorization server (Eternal-Twin), or `https://<game>/oauth/callback/<as>` where `as` is a string identifying the authorization server.


