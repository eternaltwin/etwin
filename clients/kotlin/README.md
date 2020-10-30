# Etwin

Official Eternal-Twin API net.eternaltwin.client for Java and Kotlin.

## Installation

In your `buidl.gradle.kts` file, update your `repositories` and `dependencies` sections.

```kotlin
repositories {
    // ...
    maven(url="https://dl.bintray.com/eternal-twin/maven")
}

dependencies {
    // ...
    implementation("net.eternaltwin:etwin:0.0.1")
}
```

## Getting started

### Kotlin

```kotlin
import net.eternaltwin.client.HttpEtwinClient
import net.eternaltwin.user.UserId
import java.net.URI

fun main(args: Array<String>) {
    val client = HttpEtwinClient(URI("https://eternal-twin.net/api/v1"))
    val uid = UserId("9f310484-963b-446b-af69-797feec6813f")
    val user = client.getUser(uid)
    println(user)
}
```

### Java

```java
import net.eternaltwin.client.HttpEtwinClient;
import net.eternaltwin.user.UserId;
import net.eternaltwin.user.ShortUser;

import java.net.URI;
import java.net.URISyntaxException;

public class Main {
  public static void main(String[] args) throws URISyntaxException {
    HttpEtwinClient client = new HttpEtwinClient(new URI("https://eternal-twin.net/api/v1"));
    UserId uid = new UserId("9f310484-963b-446b-af69-797feec6813f");
    ShortUser user = client.getUser(uid);
    System.out.println(user);
  }
}
```

## Tasks

- `gradlew :test`: Run the test suite
- `gradlew :dokkaHtml`: Generate the documentation
- `gradlew :publish`: Publish the new library version
