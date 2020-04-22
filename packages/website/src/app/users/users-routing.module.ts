import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";

import { UserViewComponent } from "./user-view.component";

@Injectable()
export class UserResolverService implements Resolve<User | null> {
  private readonly router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<User | null> {
    const userId: string | null = route.paramMap.get("user_id");
    if (userId !== null) {
      return {
        id: userId,
        displayName: userId,
        isAdministrator: true,
      };
    }
    return null;
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
