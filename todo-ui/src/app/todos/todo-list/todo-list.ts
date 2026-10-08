import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Todo } from '../data/todo.model';

/** Presentational: renders items and emits the id to delete. */
@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoList {
  readonly todos = input.required<readonly Todo[]>();
  readonly deletingIds = input<ReadonlySet<string>>(new Set());
  readonly deleted = output<string>();
}
