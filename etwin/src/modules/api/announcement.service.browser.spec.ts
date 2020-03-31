import { TestBed } from "@angular/core/testing";

import { BrowserAnnouncementService } from "./announcement.service.browser";

describe("BrowserAnnouncementService", () => {
  let service: BrowserAnnouncementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserAnnouncementService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
