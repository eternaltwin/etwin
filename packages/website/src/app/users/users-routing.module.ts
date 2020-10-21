import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";

import { UserService } from "../../modules/user/user.service";
import { UserViewComponent } from "./user-view.component";

@Injectable()
export class UserResolverService implements Resolve<MaybeCompleteUser | null> {
  private readonly router: Router;
  private readonly user: UserService;

  constructor(router: Router, user: UserService) {
    this.router = router;
    this.user = user;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<MaybeCompleteUser | null> {
    const userId: string | null = route.paramMap.get("user_id");
    if (userId === null) {
      return null;
    }
    return this.user.getUserById(userId).toPromise();
  }
}

const routes: Routes = [
  {
    path: ":user_id",
    component: UserViewComponent,
    pathMatch: "full",
    resolve: {
      user: UserResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [UserResolverService],
})
export class UsersRoutingModule {
}
