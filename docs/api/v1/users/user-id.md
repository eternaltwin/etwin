[Home](../../../index.md)

# /[api](../../index.md)/[v1](../index.md)/[users](./index.md)/:user_id

## GET

Returns user data.

### Examples

```
GET /api/v1/users/9f310484-963b-446b-af69-797feec6813f
```

```json
{
  "type": "User",
  "id": "9f310484-963b-446b-af69-797feec6813f",
  "display_name": {
    "current": {
      "value": "Demurgos"
    }
  },
  "is_administrator": true,
  "links": {
    "hammerfest_es": {
      "current": null,
      "old": []
    },
    "hammerfest_fr": {
      "current": {
        "link": {
          "time": "2017-05-25T23:12:50.000Z",
          "user": {
            "type": "User",
            "id": "9f310484-963b-446b-af69-797feec6813f",
            "display_name": {
              "current": {
                "value": "Demurgos"
              }
            }
          }
        },
        "unlink": null,
        "user": {
          "type": "HammerfestUser",
          "server": "hammerfest.fr",
          "id": "127",
          "username": "elseabora"
        }
      },
      "old": []
    },
    "hfest_net": {
      "current": {
        "link": {
          "time": "2017-05-25T23:13:12.000Z",
          "user": {
            "type": "User",
            "id": "9f310484-963b-446b-af69-797feec6813f",
            "display_name": {
              "current": {
                "value": "Demurgos"
              }
            }
          }
        },
        "unlink": null,
        "user": {
          "type": "HammerfestUser",
          "server": "hfest.net",
          "id": "205769",
          "username": "Demurgos"
        }
      },
      "old": []
    },
    "twinoid": {
      "current": {
        "link": {
          "time": "2020-10-26T18:53:14.493Z",
          "user": {
            "type": "User",
            "id": "9f310484-963b-446b-af69-797feec6813f",
            "display_name": {
              "current": {
                "value": "Demurgos"
              }
            }
          }
        },
        "unlink": null,
        "user": {
          "type": "TwinoidUser",
          "id": "38",
          "display_name": "Demurgos"
        }
      },
      "old": []
    }
  }
}
```
