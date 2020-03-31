import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Announcement } from "@eternal-twin/etwin-api-types/announcement/announcement";
import { Observable } from "rxjs";
import { apiUri } from "./utils/api-uri";
import { map as rxMap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class BrowserAnnouncementService {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  public getAnnouncements(): Observable<Announcement[]> {
    return this.httpClient
      .get(apiUri("announcements"))
      .pipe(rxMap(read));

    function read(raw: unknown): Announcement[] {
      // TODO: Validate and deserialize
      return raw as any;
    }
  }
}
