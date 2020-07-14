import { Component, Input, Optional, Self } from "@angular/core";
import { ControlValueAccessor, NgControl } from "@angular/forms";

@Component({
  selector: "etwin-user-input",
  templateUrl: "./user-input.component.html",
})
export class UserInputComponent implements ControlValueAccessor {
  public ngControl: NgControl;

  @Input()
  public name: string | undefined;

  @Input()
  public disabled: boolean = false;

  // The `@Optional` decorator is a workaround for an error during i18n extraction
  // (`ngControl` is in fact required)
  constructor(@Optional() @Self() ngControl: NgControl) {
    this.ngControl = ngControl;
    ngControl.valueAccessor = this;
  }

  writeValue(obj: any) {
  }

  registerOnChange(fn: any) {
  }

  registerOnTouched(fn: any) {
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
