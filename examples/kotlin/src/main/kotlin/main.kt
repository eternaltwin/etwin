// import net.eternaltwin.auth.AuthContext
import net.eternaltwin.client.Auth
import net.eternaltwin.client.HttpEtwinClient
import net.eternaltwin.user.MaybeCompleteUser
import net.eternaltwin.user.UserId
import java.net.URI

fun main() {
  val client = HttpEtwinClient(URI("https://eternal-twin.net/"))
  // Retrieve a user as a guest
  val user: MaybeCompleteUser = client.getUser(Auth.GUEST, UserId("9f310484-963b-446b-af69-797feec6813f"))
  println(user)
  println(user.id.inner)
  println(user.displayName.current.value.inner)
  // Retrieve the current user using an OAuth access token
  // val auth: Auth = Auth.fromToken("accesToken...")
  // val self: AuthContext = client.getSelf(auth)
  // println(self)
}
