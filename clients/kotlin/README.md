# Etwin

[![Bintray](https://img.shields.io/bintray/v/eternal-twin/maven/etwin)][bintray]

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
    implementation("net.eternaltwin:etwin:0.1.5")
}
```

## Getting started

### Kotlin

```kotlin
import net.eternaltwin.client.Auth
import net.eternaltwin.client.HttpEtwinClient
import net.eternaltwin.user.UserId
import java.net.URI

fun main(args: Array<String>) {
    val client = HttpEtwinClient(URI("https://eternal-twin.net/api/v1"))
    val uid = UserId("9f310484-963b-446b-af69-797feec6813f")
    val user = client.getUser(Auth.GUEST, uid)
    println(user)
}
```

### Java

```java
import net.eternaltwin.client.Auth;
import net.eternaltwin.client.HttpEtwinClient;
import net.eternaltwin.user.MaybeCompleteUser;
import net.eternaltwin.user.UserId;

import java.net.URI;
import java.net.URISyntaxException;

public class Main {
  public static void main(String[] args) throws URISyntaxException {
    HttpEtwinClient client = new HttpEtwinClient(new URI("https://eternal-twin.net/api/v1"));
    UserId uid = new UserId("9f310484-963b-446b-af69-797feec6813f");
    MaybeCompleteUser user = client.getUser(Auth.GUEST, uid);
    System.out.println(user);
  }
}
```

## Tasks

- `./gradlew :test`: Run the test suite
- `./gradlew :dokkaHtml`: Generate the documentation
- `./gradlew :publish`: Publish the new library version

[bintray]: https://bintray.com/eternal-twin/maven/etwin
