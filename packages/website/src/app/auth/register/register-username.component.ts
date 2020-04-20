import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { $Username } from "@eternal-twin/etwin-api-types/lib/user/username";
import { $UserDisplayName } from "@eternal-twin/etwin-api-types/lib/user/user-display-name";

@Component({
  selector: "etwin-register-username",
  templateUrl: "./register-username.component.html",
  styleUrls: ["./register-username.component.scss"],
})
export class RegisterUsernameComponent {
  public readonly $Username = $Username;
  public readonly $UserDisplayName = $UserDisplayName;
  public readonly PASSWORD_LEN: number = 10;

  public readonly registrationForm: FormGroup;
  public readonly username: FormControl;
  public readonly displayName: FormControl;
  public readonly password: FormControl;

  constructor() {
    this.username = new FormControl(
      "",
      [Validators.required, Validators.minLength($Username.minLength ?? 0), Validators.maxLength($Username.maxLength), Validators.pattern($Username.pattern!)],
    );
    this.displayName = new FormControl(
      "",
      [Validators.minLength($Username.minLength ?? 0), Validators.maxLength($Username.maxLength), Validators.pattern($Username.pattern!)],
    );
    this.password = new FormControl(
      "",
      [Validators.required, Validators.minLength(this.PASSWORD_LEN)],
    );
    this.registrationForm = new FormGroup({
      username: this.username,
      displayName: this.displayName,
      password: this.password,
    });
  }
}
