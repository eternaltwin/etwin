// import net.eternaltwin.auth.AuthContext;
import net.eternaltwin.client.Auth;
import net.eternaltwin.client.HttpEtwinClient;
import net.eternaltwin.user.MaybeCompleteUser;
import net.eternaltwin.user.UserId;

import java.net.URI;
import java.net.URISyntaxException;

public class Main {
  public static void main(String[] args) throws URISyntaxException {
    HttpEtwinClient client = new HttpEtwinClient(new URI("https://eternal-twin.net/api/v1"));
    // Retrieve a user as a guest
    MaybeCompleteUser user = client.getUser(Auth.GUEST, new UserId("9f310484-963b-446b-af69-797feec6813f"));
    System.out.println(user);
    // Retrieve the current user using an OAuth access token
    // Auth auth = Auth.fromToken("accesToken...");
    // AuthContext self = client.getSelf(auth);
    // System.out.println(self);
  }
}
