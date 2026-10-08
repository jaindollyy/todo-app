import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TODO_TITLE_MAX_LENGTH } from '../data/todo.model';

const notBlank = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value.trim().length > 0 ? null : { blank: true };

/** Presentational: owns the input, emits a trimmed title. The parent decides what to do with it. */
@Component({
  selector: 'app-todo-form',
  imports: [ReactiveFormsModule],
  templateUrl: './todo-form.html',
  styleUrl: './todo-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoForm {
  readonly busy = input(false);
  readonly submitted = output<string>();

  protected readonly maxLength = TODO_TITLE_MAX_LENGTH;

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notBlank, Validators.maxLength(TODO_TITLE_MAX_LENGTH)],
    }),
  });

  protected get title(): FormControl<string> {
    return this.form.controls.title;
  }

  protected submit(): void {
    if (this.busy()) {
      return;
    }
    if (this.form.invalid) {
      this.title.markAsTouched();
      return;
    }
    this.submitted.emit(this.title.value.trim());
  }

  /** Called by the parent once the item has been saved. */
  reset(): void {
    this.form.reset();
  }
}
