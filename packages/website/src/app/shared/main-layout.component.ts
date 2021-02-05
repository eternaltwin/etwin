import { Component } from "@angular/core";

@Component({
  selector: "etwin-main-layout",
  templateUrl: "./main-layout.component.html",
  styleUrls: [],
})
export class MainLayoutComponent {
  public npc_pick: number;
  constructor() {
    this.npc_pick = Math.floor(Math.random() * 11);
  }
}
