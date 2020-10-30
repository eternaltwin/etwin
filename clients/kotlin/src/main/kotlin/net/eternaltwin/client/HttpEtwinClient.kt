package net.eternaltwin.client

import JSON_FORMAT
import kotlinx.serialization.decodeFromString
import net.eternaltwin.user.*
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

class HttpEtwinClient(private val apiBase: URI) : EtwinClient {
    private val client: HttpClient = HttpClient.newBuilder().build()

    override fun getUser(userId: UserId): ShortUser {
        val request = HttpRequest.newBuilder()
            .uri(this.resolve(listOf("users", userId.toUuidString())))
            .build()
        val response = this.client.send(request, HttpResponse.BodyHandlers.ofString())
        return JSON_FORMAT.decodeFromString<ShortUser>(response.body())
    }

    private fun resolve(segments: List<String>): URI {
        val basePath = this.apiBase.path
        val path = basePath + "/" + segments.joinToString("/")
        return URI(this.apiBase.scheme, this.apiBase.host, path, "")
    }
}
