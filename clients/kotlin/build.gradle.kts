import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.4.10"
  kotlin("plugin.serialization") version "1.4.10"
  id("org.jetbrains.dokka") version "1.4.10.2"
  id("maven-publish")
}

group = "net.eternaltwin"
version = "0.3.6"

repositories {
  mavenCentral()
}

dependencies {
  implementation("com.squareup.okhttp3:okhttp:4.9.0")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-core:1.0.0")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.0.0")
  testImplementation(kotlin("test-junit5"))
  testImplementation("org.junit.jupiter:junit-jupiter:5.7.0")
  testImplementation("org.junit.jupiter:junit-jupiter-params:5.7.0")
}

tasks.withType<KotlinCompile>() {
  kotlinOptions.jvmTarget = "13"
}

tasks.test {
  useJUnitPlatform()
  testLogging {
    events("failed", "passed", "skipped")
  }
}

tasks.jar {
  manifest {
    attributes(
      mapOf(
        "Implementation-Title" to project.name,
        "Implementation-Version" to project.version
      )
    )
  }
}

java {
  withSourcesJar()
}

publishing {
  publications {
    create<MavenPublication>("etwin") {
      from(components["java"])
      pom {
        artifactId = "etwin"
        name.set("Etwin")
        description.set("Official Eternaltwin client for the JVM")
        url.set("https://gitlab.com/eternal-twin/etwin")
        licenses {
          license {
            name.set("AGPL-V3")
            url.set("https://www.gnu.org/licenses/agpl-3.0.html")
          }
        }
      }
    }
  }

  repositories {
    maven {
      name = "gitlab"
      url = uri("https://gitlab.com/api/v4/projects/17810311/packages/maven")
      credentials(HttpHeaderCredentials::class) {
        name = "Private-Token"
        value = System.getenv("MAVEN_TOKEN")
      }
      authentication {
        create<HttpHeaderAuthentication>("header")
      }
    }

    maven {
      name = "local"
      url = uri("file://${buildDir}/repo")
    }
  }
}
