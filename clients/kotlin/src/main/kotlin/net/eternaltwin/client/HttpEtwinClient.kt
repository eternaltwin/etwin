package net.eternaltwin.client

import net.eternaltwin.auth.AuthContext
import net.eternaltwin.dinoparc.*
import net.eternaltwin.user.MaybeCompleteUser
import net.eternaltwin.user.UserId
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.URI

class HttpEtwinClient(etwinUri: URI) : EtwinClient {
  private val apiBase: HttpUrl
  private val client = OkHttpClient()

  init {
    this.apiBase = etwinUri.toString().toHttpUrl()
  }

  override fun getSelf(auth: Auth): AuthContext {
    val request = auth.apply(
      Request.Builder()
        .url(this.resolve(listOf("auth", "self")))
        .get()
    )
      .build()

    this.client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw RuntimeException("Unexpected code $response")
      }
      return AuthContext.fromJsonString(response.body!!.string())
    }
  }

  override fun getUser(auth: Auth, userId: UserId): MaybeCompleteUser {
    val request = auth.apply(
      Request.Builder()
        .url(this.resolve(listOf("users", userId.toString())))
        .get()
    )
      .build()

    this.client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw RuntimeException("Unexpected code $response")
      }
      return MaybeCompleteUser.fromJsonString(response.body!!.string())
    }
  }

  override fun getDinoparcUser(auth: Auth, options: GetDinoparcUserOptions): EtwinDinoparcUser {
    val request = auth.apply(
      Request.Builder()
        .url(this.resolve(listOf("archive", "dinoparc", options.server.toString(), "users", options.id.toString())))
        .get()
    )
      .build()

    this.client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw RuntimeException("Unexpected code $response")
      }
      return EtwinDinoparcUser.fromJsonString(response.body!!.string())
    }
  }

  override fun getDinoparcDinoz(auth: Auth, options: GetDinoparcDinozOptions): EtwinDinoparcDinoz {
    val request = auth.apply(
      Request.Builder()
        .url(this.resolve(listOf("archive", "dinoparc", options.server.toString(), "dinoz", options.id.toString())))
        .get()
    )
      .build()

    this.client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw RuntimeException("Unexpected code $response")
      }
      return EtwinDinoparcDinoz.fromJsonString(response.body!!.string())
    }
  }

  private fun resolve(segments: List<String>): HttpUrl {
    var builder = this.apiBase.newBuilder()
      .addPathSegment("api")
      .addPathSegment("v1");
    for (segment in segments) {
      builder = builder.addPathSegment(segment)
    }
    return builder.build()
  }
}
