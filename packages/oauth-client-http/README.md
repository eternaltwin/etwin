# HTTP-based Oauth client service

**Work in progress**: HTTP-base Oauth Client implementation. Currently tailored for Twinoid but intended to support both Twinoid and Eternal-Twin.

## CJWT

**Compressed JSON Web Token** is the format used for the OAuth state string.
This format is used to bypass the length limit imposed by some providers: Twinoid restricts the `state` length to 255 characters.

The compressed JWT is computed as `brotli(json([header, payload, signature]))`.

This format was chosen because it yielded the shortest output for the following JWT. See the table for comparisons:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZnAiOiJUT0RPIiwiYSI6eyJ0eXBlIjoiTGluayIsInVzZXJfaWQiOiJjNzI1YzQzNC0wM2ZhLTRlY2MtYmQ3Zi1iOTllMDAyZTljZWUifSwiaWF0IjoxNjAzNDU4NjYyLCJhcyI6InR3aW5vaWQuY29tIiwiZXhwIjoxNjAzNDU5NTYyfQ.uJXsgU0wPYRYDg_3NzbOEHMWlOQ6r4hk6-0lh8s40X8
```

| Encoding                  | Compression | Length  |
|---------------------------|-------------|---------|
| `jwt`                     | None        | **263** |
| `bson([hdr, pload, sig])` | None        | 225     |
| `jwt`                     | Deflate     | 223     |
| `bson([hdr, pload, sig])` | Deflate     | 225     |
| `jwt`                     | Brotli      | 212     |
| `json([hdr, pload, sig])` | None        | 212     |
| `json([hdr, pload, sig])` | Gzip        | 197     |
| `json([hdr, pload, sig])` | Deflate     | 185     |
| `json([hdr, pload, sig])` | Brotli      | **179** |
