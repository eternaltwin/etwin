[Home](../index.md) | [Contributing](./index.md)

# Archive

This document gives a high-level description of how Eternaltwin archives data
from the MT website.

For each website we archive, there is a client and a store.

The role of the client is to handle the communication with the website: convert
queries to HTTP requests, send them, and process the response. Most MT websites
only return the response as an HTTP page (no API), the client has a component
converting the HTML response to a more suitable format: the scraper.

The store saves the server responses and persists them in a database. It stores
all the responses (so it creates a history of changes). The store is
responsible for building the latest known state of a known state so it
can be exported, ready to be consumed by any other website (usually one of
our game websites).

![Archive schema](https://i.imgur.com/ocbphRB.png)
