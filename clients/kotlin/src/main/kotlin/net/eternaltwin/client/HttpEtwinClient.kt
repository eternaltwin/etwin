package net.eternaltwin.client

import JSON_FORMAT
import kotlinx.serialization.decodeFromString
import net.eternaltwin.auth.AuthContext
import net.eternaltwin.user.MaybeCompleteUser
import net.eternaltwin.user.UserId
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

class HttpEtwinClient(private val apiBase: URI) : EtwinClient {
  private val client: HttpClient = HttpClient.newBuilder().build()

  override fun getSelf(auth: Auth): AuthContext {
    val request = this.newRequestBuilder(auth)
      .uri(this.resolve(listOf("auth", "self")))
      .build()
    val response = this.client.send(request, HttpResponse.BodyHandlers.ofString())
    return JSON_FORMAT.decodeFromString(response.body())
  }

  override fun getUser(auth: Auth, userId: UserId): MaybeCompleteUser {
    val request = this.newRequestBuilder(auth)
      .uri(this.resolve(listOf("users", userId.toUuidString())))
      .build()
    val response = this.client.send(request, HttpResponse.BodyHandlers.ofString())
    return JSON_FORMAT.decodeFromString(response.body())
  }

  private fun newRequestBuilder(auth: Auth): HttpRequest.Builder {
    val builder = HttpRequest.newBuilder();
    auth.apply(builder)
    return builder
  }

  private fun resolve(segments: List<String>): URI {
    val basePath = this.apiBase.path
    val path = basePath + "/" + segments.joinToString("/")
    return URI(this.apiBase.scheme, this.apiBase.host, path, "")
  }
}
