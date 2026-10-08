import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TodoApiService } from './todo-api.service';
import { Todo } from './todo.model';

/** Signal-based state for the TODO list. Components read signals and call methods; they never touch HTTP. */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly api = inject(TodoApiService);

  private readonly _todos = signal<readonly Todo[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _deletingIds = signal<ReadonlySet<string>>(new Set());
  private readonly _error = signal<string | null>(null);

  readonly todos = this._todos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly deletingIds = this._deletingIds.asReadonly();
  readonly error = this._error.asReadonly();
  readonly count = computed(() => this._todos().length);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._todos.set(await firstValueFrom(this.api.getAll()));
    } catch {
      this._error.set('Could not load your TODO list. Check the API is running and try again.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Returns true when the item was created, so the caller can clear its input. */
  async add(title: string): Promise<boolean> {
    const trimmed = title.trim();
    if (!trimmed || this._saving()) {
      return false;
    }

    this._saving.set(true);
    this._error.set(null);
    try {
      const created = await firstValueFrom(this.api.create({ title: trimmed }));
      this._todos.update((todos) => [...todos, created]);
      return true;
    } catch (err) {
      this._error.set(validationMessage(err) ?? 'Could not add the item. Please try again.');
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    if (this._deletingIds().has(id)) {
      return;
    }

    this._deletingIds.update((ids) => new Set(ids).add(id));
    this._error.set(null);
    try {
      await firstValueFrom(this.api.delete(id));
      this.removeLocally(id);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        // Already gone on the server — the outcome the user wanted.
        this.removeLocally(id);
      } else {
        this._error.set('Could not delete the item. Please try again.');
      }
    } finally {
      this._deletingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
  }

  private removeLocally(id: string): void {
    this._todos.update((todos) => todos.filter((t) => t.id !== id));
  }
}

/** Pulls the first message out of an ASP.NET ValidationProblemDetails response. */
function validationMessage(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) {
    return null;
  }
  const errors = (err.error as { errors?: Record<string, string[]> } | null)?.errors;
  const first = errors ? Object.values(errors).flat()[0] : undefined;
  return first ?? null;
}
