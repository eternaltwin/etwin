[Home](../index.md) | [Applications](./index.md)

# Eternal-Twin for OAuth

## Technical information

- Authorization endpoint: `/oauth/authorize`
- Token endpoint: `/oauth/token`
- Client ID: Displayed when starting `etwin`: `Id` or `Key` at your choice (`Key` is recommended)
- Client secret: As configured in your `etwin.toml` file.

## External documents

- [RFC 6749 - The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [Auth0 documentation](https://auth0.com/docs/flows/authorization-code-flow)
- [Twinoid documentation](https://twinoid.com/developers/doc)

# Registering the client

The first to use Eternal-Twin as an OAuth provider is to register you game or app as a client.
This step is achieved through the `etwin.toml` configuration file.

You must add an [OAuth client section](https://gitlab.com/eternal-twin/etwin/-/blob/master/etwin.toml.example#L34)
and **restart Eternal-Twin**.

Follow the documentation in the `etwin.toml` file. Here is an example:

```
[clients.myproject]
display_name = "My Project"
app_uri = "http://localhost:8080"
callback_uri = "http://localhost:8080/oauth/callback"
secret = "dev_secret"
```

The key `myproject` is used as an internal identifier for your project.

The `display_name` and `app_uri` are not used yet, they are meant to
identify your app to users.

The `callback_uri` value is the absolute URI to your OAuth callback endpoint:
the URI where users are redirected back to your app with their authorization
code.

`secret` defines the secret key shared between Eternal-Twin and your OAuth
client. It is used when exchanging the authorization code for an access token.
When running your project locally, it is recommended to leave it as
`dev_secret`. When running in production, the secret is a long random string.

Restart your local Eternal-Twin server to apply the changes. When Eternal-Twin
starts, it prints details about the current configuration. You should see a
section for your OAuth client:

```
myproject {
  Id: 38f33c3f-db3b-49ce-81a7-597c97ba3162
  Key: myproject@clients
  Display name: My Project
  App URI: http://localhost:8080/
  Callback URI: http://localhost:8080/oauth/callback
}
```

The OAuth protocol referes to a `client_id` value used to identify your client.
Eternal-Twin allows you to use either the `Id` field or the `Key` field as your
`client_id`. It is recommended to use the `Key` value as the `client_id`: the
`Id` changes every time the client is registered while the `Key` is stable.

## Acquiring the Access token

OAuth is a standard protocol. You should check if your language has existing
libraries to help you acquiring the access token.

### User redirection

Add a form on your app containing a single button `Sign-in with Eternal-Twin`
and no text field (you may add some hidden fields as needed).
Clicking on this button should submit the form through POST to your own server.

The server should reply to this request with a redirection to the
Eternal-Twin authorization endpoint: HTTP status code `302` with a `Location`
header.

The redirection URL is built with the following parameters:

| Name                      | Value                                                                         |
|---------------------------|-------------------------------------------------------------------------------|
| Origin                    | Eternal-Twin `external_uri` config. `http://localhost:50320` by default during devlopment, `https://eternalfest.net` in production. Your app should get this value from the environment (config file, environment variable) |
| Pathname                  | `/oauth/authorize`                                                            |
| `access_type` parameter   | The string `offline`                                                          |
| `response_type` parameter | The string `code`                                                             |
| `client_id` parameter     | Must match your client's `Id` or `Key` field (displayed when starting Eternal-Twin) |
| `redirect_uri` parameter  | Must match the `callback_uri` field from the client registration.             |
| `scope` parameter         | The empty string, or `base`                                                   |
| `state` parameter         | A string holding your application state. It is recommeded to use a signed JWT |

Example:

```
http://localhost:50320/oauth/authorize?access_type=offline&response_type=code&client_id=eternalfest%40clients&redirect_uri=http%3A%2F%2Flocalhost%3A50313%2Foauth%2Fcallback&scope=&state=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6ImJkZWQyZDg5MWFlNDYwMTk2OWZhZmI0YjAxMmQ3ODZiIiwiaWF0IjoxNjA3OTU0NDExLCJleHAiOjE2MDgwNDA4MTF9.BRvm4D4Rfc2ZoHwlzLtEd3oiyJmxCq4eqPmxhYXRz7g
```

### User return

Once Eternal-Twin has authenticated the user, it is redirected back to your app
at the URI defined as the `callback_uri`.

Eternal-Twin will append the following search parameters:
- In case of error:
  - `error`: See OAuth RFC
  - `state`
- In case of success:
  - `code`: The one-time authorization code
  - `state`

Example (success):

```
http://localhost:50313/oauth/callback?code=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZXMiOlsiYmFzZSJdLCJpYXQiOjE2MDc5NTU4ODYsImV4cCI6MTYwNzk1NjE4NiwiYXVkIjpbIjhlNGY4MDY5LTRlN2MtNDkzYS1hYTA3LTNhNGFmNmIwYmZjNCIsImV0ZXJuYWxmZXN0QGNsaWVudHMiXSwiaXNzIjoiZXR3aW4iLCJzdWIiOiJkMTYxNjRhNC1hODliLTRhYzUtOGNkYS03ZDU1ZjkzMWFkYjgifQ.Vm-M5SfMjEHuRreRUzaMYJW0cUeIrlMwHIJP9fmFf_Y&state=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemF0aW9uU2VydmVyIjoiZXRlcm5hbC10d2luLm5ldCIsInJlcXVlc3RGb3JnZXJ5UHJvdGVjdGlvbiI6ImJkZWQyZDg5MWFlNDYwMTk2OWZhZmI0YjAxMmQ3ODZiIiwiaWF0IjoxNjA3OTU0NDExLCJleHAiOjE2MDgwNDA4MTF9.BRvm4D4Rfc2ZoHwlzLtEd3oiyJmxCq4eqPmxhYXRz7g
```

### Claiming the token

On success, your `callback_uri` handler receives a one-time authorization code
(`code`). You can exchange this code for a long-term access token.

You app must perform a direct request to the Eternal-Twin server (not a client
redirection).

| Name                            | Value                                                     |
|---------------------------------|-----------------------------------------------------------|
| Method                          | `POST`                                                    |
| Origin                          | Eternal-Twin `external_uri` config.                       |
| Pathname                        | `/oauth/token`                                            |
| `Authorization` header          | Scheme: `Basic`, login: OAuth client `Id` or `Key`, password: `secret` field from the `etwin.toml` |
| `Content-type` header           | `application/json` or `application/x-www-form-urlencoded` |
| `code` request body field       | The value of the one-time authorization code              |
| `grant_type` request body field | The string `authorization_code`                           |

The Eternal-Twin server will respond with the access token:

```
{
  access_token: "AMHILF5gGddDnfqVj9K8yIeP3VMIgaxG",
  refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD",
  expires_in: 7200,
  token_type: "Bearer",
}
```

The value of the `access_token` field is the one you should use with API clients.

## Next steps

The next step is usually to immediately use this `access_token` to get data about
the current user from the API and authenticate it.

See [using the Eternal-Twin API](./etwin-api.md).
