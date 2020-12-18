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
    System.out.println(user.getId().getInner());
    System.out.println(user.getDisplayName().getCurrent().getValue().getInner());
    // Retrieve the current user using an OAuth access token
    // AuthContext self = client.getSelf(Auth.fromToken("accesToken..."));
    // System.out.println(self);
    // AccessTokenAuthContext acx = ((AuthContext.AccessToken) self).getInner();
    // System.out.println(acx);
  }
}
