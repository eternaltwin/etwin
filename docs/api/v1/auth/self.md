[Home](../../../index.md)

# /[api](../../index.md)/[v1](../index.md)/[auth](./index.md)/self

## GET

Returns data describing the authentication context of the request.

### Examples

Guest:

```
GET /api/v1/auth/self
```

```json
{
  "type": "Guest",
  "scope": "Default"
}
```

User (using a session cookie):

```
GET /api/v1/auth/self
Cookie: sid=b8be19ef-2d61-44de-b7d2-9c34ccb8a763
```

```json
{
  "type": "User",
  "scope": "Default",
  "user": {
    "type": "User",
    "id": "9f310484-963b-446b-af69-797feec6813f",
    "display_name": {
      "current": {
        "value": "Demurgos"
      }
    }
  },
  "is_administrator": true
}
```

OAuth acess token:

```
GET /api/v1/auth/self
Authorization: Bearer 5f6613eb-880f-4b01-8e71-96b644e4584f
```

```json
{
  "type": "AccessToken",
  "scope": "Default",
  "client": {
    "type": "OauthClient",
    "id": "d19e61a3-83d3-410f-84ec-49aaab841559",
    "key": "eternalfest@clients",
    "display_name": "Eternalfest"
  },
  "user": {
    "type": "User",
    "id": "0d8d5067-5954-4930-94be-c1d09bf71903",
    "display_name": {
      "current": {
        "value": "Elseabora"
      }
    }
  }
}
```
