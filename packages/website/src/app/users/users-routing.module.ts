import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user";
import { User } from "@eternal-twin/core/lib/user/user";

import { UserService } from "../../modules/user/user.service";
import { UserViewComponent } from "./user-view.component";

@Injectable()
export class UserResolverService implements Resolve<User | null> {
  private readonly router: Router;
  private readonly user: UserService;

  constructor(router: Router, user: UserService) {
    this.router = router;
    this.user = user;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<User | CompleteUser | null> {
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
