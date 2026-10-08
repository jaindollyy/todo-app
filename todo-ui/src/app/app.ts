import { ChangeDetectionStrategy, Component, OnInit, inject, viewChild } from '@angular/core';
import { TodoStore } from './todos/data/todo.store';
import { TodoForm } from './todos/todo-form/todo-form';
import { TodoList } from './todos/todo-list/todo-list';

/** Container: wires the store to the presentational components. */
@Component({
  selector: 'app-root',
  imports: [TodoForm, TodoList],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly store = inject(TodoStore);
  private readonly form = viewChild.required(TodoForm);

  ngOnInit(): void {
    void this.store.load();
  }

  protected async onAdd(title: string): Promise<void> {
    if (await this.store.add(title)) {
      this.form().reset();
    }
  }

  protected onDelete(id: string): void {
    void this.store.remove(id);
  }

  protected onRetry(): void {
    void this.store.load();
  }
}
