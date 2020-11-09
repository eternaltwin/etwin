import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.4.10"
  application
}
group = "net.eternaltwin"
version = "1.0-SNAPSHOT"

repositories {
  jcenter()
  mavenCentral()
  maven(url = "https://dl.bintray.com/eternal-twin/maven")
}
dependencies {
//  implementation(files("../../clients/kotlin/build/libs/etwin-0.1.3.jar"))
  implementation("net.eternaltwin:etwin:0.1.3")
  testImplementation(kotlin("test-junit5"))
}
tasks.withType<KotlinCompile>() {
  kotlinOptions.jvmTarget = "13"
}
application {
  mainClassName = "MainKt"
}
