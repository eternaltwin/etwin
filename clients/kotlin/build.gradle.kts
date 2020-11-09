import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.4.10"
  kotlin("plugin.serialization") version "1.4.10"
  id("org.jetbrains.dokka") version "1.4.10.2"
  id("maven-publish")
}

group = "net.eternaltwin"
version = "0.1.5"

repositories {
  jcenter()
}

dependencies {
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.0.0")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-core:1.0.0")
  implementation("net.eternaltwin:etwin:0.0.1")
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
        name.set("Etwin")
        description.set("A demonstration of Maven POM customization")
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
//        maven {
//            name = "gitlab"
//            url = uri("https://gitlab.com/api/v4/projects/${System.getenv("CI_PROJECT_ID")}/packages/maven")
//            credentials(HttpHeaderCredentials::class) {
//                name = "Job-Token"
//                value = System.getenv("CI_JOB_TOKEN")
//            }
//            authentication {
//                create<HttpHeaderAuthentication>("header")
//            }
//        }

    maven {
      name = "bintray"
      url = uri("https://api.bintray.com/maven/eternal-twin/maven/etwin/;publish=1;override=1")
      credentials {
        username = "demurgos"
        password = "<apiKey>"
      }
    }

    maven {
      name = "local"
      url = uri("file://${buildDir}/repo")
    }
  }
}
