import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";

import { ForumService } from "../../modules/forum/forum.service";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumSectionComponent } from "./forum-section.component";
import { ForumThreadComponent } from "./forum-thread.component";
import { NewForumPostComponent } from "./new-forum-post.component";
import { NewForumThreadComponent } from "./new-forum-thread.component";

@Injectable()
export class ForumSectionsResolverService implements Resolve<ForumSectionListing> {
  private readonly router: Router;
  private readonly forum: ForumService;

  constructor(router: Router, forum: ForumService) {
    this.router = router;
    this.forum = forum;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ForumSectionListing> {
    return this.forum.getForumSections().toPromise();
  }
}

@Injectable()
export class ForumSectionResolverService implements Resolve<ForumSection | null> {
  private readonly router: Router;
  private readonly forum: ForumService;

  constructor(router: Router, forum: ForumService) {
    this.router = router;
    this.forum = forum;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ForumSection | null> {
    const sectionIdOrKey: string | null = route.paramMap.get("section_id");
    if (sectionIdOrKey === null) {
      return null;
    }
    return this.forum.getForumSection(sectionIdOrKey).toPromise();
  }
}

@Injectable()
export class ForumThreadResolverService implements Resolve<ForumThread | null> {
  private readonly router: Router;
  private readonly forum: ForumService;

  constructor(router: Router, forum: ForumService) {
    this.router = router;
    this.forum = forum;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ForumThread | null> {
    const threadIdOrKey: string | null = route.paramMap.get("thread_id");
    if (threadIdOrKey === null) {
      return null;
    }
    return this.forum.getForumThread(threadIdOrKey).toPromise();
  }
}

const routes: Routes = [
  {
    path: "",
    component: ForumHomeComponent,
    pathMatch: "full",
    resolve: {
      sections: ForumSectionsResolverService,
    },
  },
  {
    path: "sections/:section_id",
    component: ForumSectionComponent,
    pathMatch: "full",
    resolve: {
      section: ForumSectionResolverService,
    },
  },
  {
    path: "sections/:section_id/new",
    component: NewForumThreadComponent,
    pathMatch: "full",
    resolve: {
      section: ForumSectionResolverService,
    },
  },
  {
    path: "threads/:thread_id",
    component: ForumThreadComponent,
    pathMatch: "full",
    resolve: {
      thread: ForumThreadResolverService,
    },
  },
  {
    path: "threads/:thread_id/reply",
    component: NewForumPostComponent,
    pathMatch: "full",
    resolve: {
      thread: ForumThreadResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [ForumSectionsResolverService, ForumSectionResolverService, ForumThreadResolverService],
})
export class ForumRoutingModule {
}
