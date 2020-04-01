import { Injectable } from "@angular/core";
import { Announcement } from "@eternal-twin/etwin-api-types/lib/announcement/announcement";
import { Observable, of as rxOf } from "rxjs";

@Injectable({
  providedIn: "root",
})
export abstract class AnnouncementService {
  public abstract getAnnouncements(): Observable<Announcement[]>;
}
