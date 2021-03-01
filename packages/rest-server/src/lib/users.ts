import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import {
  $RegisterWithUsernameOptions,
  RegisterWithUsernameOptions,
} from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import {
  $RegisterWithVerifiedEmailOptions,
  RegisterWithVerifiedEmailOptions,
} from "@eternal-twin/core/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { $DinoparcUserIdRef, DinoparcUserIdRef } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id-ref.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { $HammerfestUserIdRef, HammerfestUserIdRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id-ref.js";
import { $VersionedDinoparcLink, VersionedDinoparcLink } from "@eternal-twin/core/lib/link/versioned-dinoparc-link.js";
import {
  $VersionedHammerfestLink,
  VersionedHammerfestLink
} from "@eternal-twin/core/lib/link/versioned-hammerfest-link.js";
import { $VersionedTwinoidLink, VersionedTwinoidLink } from "@eternal-twin/core/lib/link/versioned-twinoid-link.js";
import { $TwinoidUserIdRef, TwinoidUserIdRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-id-ref.js";
import { $CompleteUser, CompleteUser } from "@eternal-twin/core/lib/user/complete-user.js";
import { $LinkToDinoparcOptions, LinkToDinoparcOptions } from "@eternal-twin/core/lib/user/link-to-dinoparc-options.js";
import {
  $LinkToHammerfestOptions,
  LinkToHammerfestOptions
} from "@eternal-twin/core/lib/user/link-to-hammerfest-options.js";
import { $LinkToTwinoidOptions, LinkToTwinoidOptions } from "@eternal-twin/core/lib/user/link-to-twinoid-options.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { $UpdateUserPatch, UpdateUserPatch } from "@eternal-twin/core/lib/user/update-user-patch.js";
import { $User, User } from "@eternal-twin/core/lib/user/user.js";
import { $UserId, UserId } from "@eternal-twin/core/lib/user/user-id.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { TryUnionType } from "kryo/lib/try-union.js";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth, SESSION_COOKIE } from "./helpers/koa-auth.js";
import { KoaState } from "./koa-state";

const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();
const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  user: UserService;
}

type CreateUserBody = RegisterWithVerifiedEmailOptions | RegisterWithUsernameOptions;

const $CreateUserBody: TryUnionType<CreateUserBody> = new TryUnionType<CreateUserBody>({
  variants: [$RegisterWithVerifiedEmailOptions, $RegisterWithUsernameOptions],
});

export function createUsersRouter(api: Api): Router {
  const router: Router = new Router();

  router.post("/", koaCompose([koaBodyParser(), createUser]));

  async function createUser(cx: RouterContext<KoaState>): Promise<void> {
    const variantValue = $CreateUserBody.variantRead(JSON_VALUE_READER, cx.request.body);
    let userAndSession: UserAndSession;
    switch (variantValue.variant) {
      case $RegisterWithVerifiedEmailOptions: {
        const body: RegisterWithVerifiedEmailOptions = variantValue.value as RegisterWithVerifiedEmailOptions;
        userAndSession = await api.auth.registerWithVerifiedEmail(GUEST_AUTH, body);
        break;
      }
      case $RegisterWithUsernameOptions: {
        const body: RegisterWithUsernameOptions = variantValue.value as RegisterWithUsernameOptions;
        userAndSession = await api.auth.registerWithUsername(GUEST_AUTH, body);
        break;
      }
      default: {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidBody"};
        return;
      }
    }
    cx.cookies.set(SESSION_COOKIE, userAndSession.session.id);
    const acx: UserAuthContext = {
      type: AuthType.User,
      user: userAndSession.user,
      isAdministrator: userAndSession.isAdministrator,
      scope: AuthScope.Default,
    };
    const user: User | null = await api.user.getUserById(acx, {id: userAndSession.user.id});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    cx.response.body = $User.write(JSON_VALUE_WRITER, user);
  }

  router.get("/:user_id", getUserById);

  async function getUserById(cx: RouterContext<KoaState>): Promise<void> {
    const rawUserId = cx.params["user_id"];
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$UserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidId"};
      return;
    }
    const userId: UserId = rawUserId;
    const user: CompleteUser | User | null = await api.user.getUserById(acx, {id: userId});
    if (user === null) {
      cx.response.status = 404;
      cx.response.body = {error: "UserNotFound"};
      return;
    }
    if ($CompleteUser.test(user)) {
      cx.response.body = $CompleteUser.write(JSON_VALUE_WRITER, user);
    } else {
      cx.response.body = $User.write(JSON_VALUE_WRITER, user);
    }
  }

  router.patch("/:user_id", koaCompose([koaBodyParser(), updateUserById]));

  async function updateUserById(cx: RouterContext<KoaState>): Promise<void> {
    const rawUserId = cx.params["user_id"];
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$UserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidId"};
      return;
    }
    const userId: UserId = rawUserId;
    let body: UpdateUserPatch;
    try {
      body = $UpdateUserPatch.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    let user: User;
    try {
      user = await api.user.updateUser(acx, userId, body);
    } catch (err) {
      console.error(err);
      cx.response.status = 500;
      cx.response.body = {error: "FailedUserUpdate"};
      return;
    }
    cx.response.body = $User.write(JSON_VALUE_WRITER, user);
  }

  router.put("/:user_id/links/:remote", koaCompose([koaBodyParser(), putUserLink]));

  async function putUserLink(cx: RouterContext<KoaState>): Promise<void> {
    const rawUserId = cx.params["user_id"];
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$UserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidId"};
      return;
    }
    const userId: UserId = rawUserId;
    switch (cx.params["remote"]) {
      case "dinoparc.com":
      case "en.dinoparc.com":
      case "sp.dinoparc.com":
        return linkDinoparc(cx.params["remote"]);
      case "hammerfest.es":
      case "hammerfest.fr":
      case "hfest.net":
        return linkHammerfest(cx.params["remote"]);
      case "twinoid.com":
        return linkTwinoid();
    }

    async function linkDinoparc(dinoparcServer: DinoparcServer): Promise<void> {
      let body: LinkToDinoparcOptions;
      try {
        body = $LinkToDinoparcOptions.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      if (body.userId !== userId || body.dinoparcServer !== dinoparcServer) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidId"};
        return;
      }
      let link: VersionedDinoparcLink;
      try {
        link = await api.user.linkToDinoparc(acx, body);
      } catch (err) {
        console.error(err);
        cx.response.status = 500;
        cx.response.body = {error: "FailedUserUpdate"};
        return;
      }
      cx.response.body = $VersionedDinoparcLink.write(JSON_VALUE_WRITER, link);
    }

    async function linkHammerfest(hammerfestServer: HammerfestServer): Promise<void> {
      let body: LinkToHammerfestOptions;
      try {
        body = $LinkToHammerfestOptions.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      if (body.userId !== userId || body.hammerfestServer !== hammerfestServer) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidId"};
        return;
      }
      let link: VersionedHammerfestLink;
      try {
        link = await api.user.linkToHammerfest(acx, body);
      } catch (err) {
        console.error(err);
        cx.response.status = 500;
        cx.response.body = {error: "FailedUserUpdate"};
        return;
      }
      cx.response.body = $VersionedHammerfestLink.write(JSON_VALUE_WRITER, link);
    }

    async function linkTwinoid(): Promise<void> {
      let body: LinkToTwinoidOptions;
      try {
        body = $LinkToTwinoidOptions.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      if (body.userId !== userId) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidId"};
        return;
      }
      let link: VersionedTwinoidLink;
      try {
        link = await api.user.linkToTwinoid(acx, body);
      } catch (err) {
        console.error(err);
        cx.response.status = 500;
        cx.response.body = {error: "FailedUserUpdate"};
        return;
      }
      cx.response.body = $VersionedTwinoidLink.write(JSON_VALUE_WRITER, link);
    }
  }

  router.delete("/:user_id/links/:remote", koaCompose([koaBodyParser(), deleteUserLink]));

  async function deleteUserLink(cx: RouterContext<KoaState>): Promise<void> {
    const rawUserId = cx.params["user_id"];
    const acx: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$UserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidId"};
      return;
    }
    const userId: UserId = rawUserId;
    switch (cx.params["remote"]) {
      case "dinoparc.com":
      case "en.dinoparc.com":
      case "sp.dinoparc.com":
        return unlinkDinoparc(cx.params["remote"]);
      case "hammerfest.es":
      case "hammerfest.fr":
      case "hfest.net":
        return unlinkHammerfest(cx.params["remote"]);
      case "twinoid.com":
        return unlinkTwinoid();
    }

    async function unlinkDinoparc(dinoparcServer: DinoparcServer): Promise<void> {
      let body: DinoparcUserIdRef;
      try {
        body = $DinoparcUserIdRef.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      if (body.server !== dinoparcServer) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidId"};
        return;
      }
      let link: VersionedDinoparcLink;
      try {
        link = await api.user.unlinkFromDinoparc(acx, {userId, dinoparcServer, dinoparcUserId: body.id});
      } catch (err) {
        console.error(err);
        cx.response.status = 500;
        cx.response.body = {error: "FailedUserUpdate"};
        return;
      }
      cx.response.body = $VersionedDinoparcLink.write(JSON_VALUE_WRITER, link);
    }

    async function unlinkHammerfest(hammerfestServer: HammerfestServer): Promise<void> {
      let body: HammerfestUserIdRef;
      try {
        body = $HammerfestUserIdRef.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      if (body.server !== hammerfestServer) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidId"};
        return;
      }
      let link: VersionedHammerfestLink;
      try {
        link = await api.user.unlinkFromHammerfest(acx, {userId, hammerfestServer, hammerfestUserId: body.id});
      } catch (err) {
        console.error(err);
        cx.response.status = 500;
        cx.response.body = {error: "FailedUserUpdate"};
        return;
      }
      cx.response.body = $VersionedHammerfestLink.write(JSON_VALUE_WRITER, link);
    }

    async function unlinkTwinoid(): Promise<void> {
      let body: TwinoidUserIdRef;
      try {
        body = $TwinoidUserIdRef.read(JSON_VALUE_READER, cx.request.body);
      } catch (_err) {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidRequestBody"};
        return;
      }
      let link: VersionedTwinoidLink;
      try {
        link = await api.user.unlinkFromTwinoid(acx, {userId, twinoidUserId: body.id});
      } catch (err) {
        console.error(err);
        cx.response.status = 500;
        cx.response.body = {error: "FailedUserUpdate"};
        return;
      }
      cx.response.body = $VersionedTwinoidLink.write(JSON_VALUE_WRITER, link);
    }
  }

  return router;
}
