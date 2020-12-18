plugins {
  java
  application
}

group = "net.eternaltwin"
version = "1.0-SNAPSHOT"

repositories {
  jcenter()
  maven(url = "https://dl.bintray.com/eternal-twin/maven")
}

dependencies {
  implementation("net.eternaltwin:etwin:0.3.6")
  testImplementation("org.junit.jupiter:junit-jupiter-engine:5.6.2")
}

application {
  mainClassName = "Main"
}
