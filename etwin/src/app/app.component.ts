import { Component } from "@angular/core";
import { Announcement } from "@eternal-twin/etwin-api-types/announcement/announcement";
import { Observable } from "rxjs";
import { AnnouncementService } from "../modules/api/announcement.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  private readonly announcementService: AnnouncementService;
  public announcements$: Observable<Announcement[]>;

  constructor(announcementService: AnnouncementService) {
    this.announcementService = announcementService;
    this.announcements$ = this.announcementService.getAnnouncements();
  }
}
