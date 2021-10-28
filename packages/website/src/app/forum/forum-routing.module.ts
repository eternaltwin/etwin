import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { ForumPost } from "@eternal-twin/core/forum/forum-post";
import { ForumSection } from "@eternal-twin/core/forum/forum-section";
import { ForumSectionListing } from "@eternal-twin/core/forum/forum-section-listing";
import { ForumThread } from "@eternal-twin/core/forum/forum-thread";
import { firstValueFrom } from "rxjs";

import { ForumService } from "../../modules/forum/forum.service";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumSectionComponent } from "./forum-section.component";
import { ForumThreadComponent } from "./forum-thread.component";
import { NewForumPostComponent } from "./new-forum-post.component";
import { NewForumThreadComponent } from "./new-forum-thread.component";
import { UpdateForumPostComponent } from "./update-forum-post.component";

@Injectable()
export class ForumSectionsResolverService implements Resolve<ForumSectionListing> {
  private readonly router: Router;
  private readonly forum: ForumService;

  constructor(router: Router, forum: ForumService) {
    this.router = router;
    this.forum = forum;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ForumSectionListing> {
    return firstValueFrom(this.forum.getForumSections());
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
    // `tp`: `thread page`
    const pageStr = route.queryParamMap.get("tp");
    const page: number = pageStr !== null ? parseInt(pageStr, 10) : 1;
    if (page > 0) {
      return firstValueFrom(this.forum.getForumSection(sectionIdOrKey, page - 1));
    } else {
      return null;
    }
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
    const pageStr = route.queryParamMap.get("p");
    const page: number = pageStr !== null ? parseInt(pageStr, 10) : 1;
    if (page > 0) {
      return firstValueFrom(this.forum.getForumThread(threadIdOrKey, page - 1));
    } else {
      return null;
    }
  }
}

@Injectable()
export class ForumPostResolverService implements Resolve<ForumPost | null> {
  private readonly router: Router;
  private readonly forum: ForumService;

  constructor(router: Router, forum: ForumService) {
    this.router = router;
    this.forum = forum;
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ForumPost | null> {
    const postId: string | null = route.paramMap.get("post_id");
    if (postId === null) {
      return null;
    }
    // const pageStr = route.queryParamMap.get("p");
    // const page: number = pageStr !== null ? parseInt(pageStr, 10) : 1;
    return firstValueFrom(this.forum.getForumPost(postId, 0));
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
    runGuardsAndResolvers: "always",
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
    runGuardsAndResolvers: "paramsOrQueryParamsChange",
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
  {
    path: "posts/:post_id/edit",
    component: UpdateForumPostComponent,
    pathMatch: "full",
    runGuardsAndResolvers: "paramsOrQueryParamsChange",
    resolve: {
      post: ForumPostResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [ForumPostResolverService, ForumSectionsResolverService, ForumSectionResolverService, ForumThreadResolverService],
})
export class ForumRoutingModule {
}
