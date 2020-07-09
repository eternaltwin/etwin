import { Component, Input, Self } from "@angular/core";
import { ControlValueAccessor, NgControl } from "@angular/forms";

@Component({
  selector: "etwin-user-input",
  templateUrl: "./user-input.component.html",
  // To support fully custom value accessor, remove the `NgControl` injector and uncomment the next block
  // providers: [
  //   {
  //     provide: NG_VALUE_ACCESSOR,
  //     useExisting: forwardRef(() => UserInputComponent),
  //     multi: true,
  //   },
  // ],
})
export class UserInputComponent implements ControlValueAccessor {
  public ngControl: NgControl;

  @Input()
  public name: string | undefined;

  @Input()
  public disabled: boolean = false;

  constructor(@Self() ngControl: NgControl) {
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
