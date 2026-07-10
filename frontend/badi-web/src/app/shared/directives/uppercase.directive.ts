import { Directive, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseDirective {
  constructor(@Optional() @Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    
    if (input.readOnly || input.disabled) return;

    const value = input.value;
    if (typeof value === 'string') {
      const uppercaseValue = value.toLocaleUpperCase('es-EC');

      if (value !== uppercaseValue) {
        const start = input.selectionStart;
        const end = input.selectionEnd;

        input.value = uppercaseValue;
        
        if (this.ngControl && this.ngControl.control) {
          this.ngControl.control.setValue(uppercaseValue, { emitEvent: false });
        }

        if (start !== null && end !== null) {
          input.setSelectionRange(start, end);
        }
      }
    }
  }
}
