import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Todo } from '../data/todo.model';
import { TodoList } from './todo-list';

describe('TodoList', () => {
  let fixture: ComponentFixture<TodoList>;
  let el: HTMLElement;

  const todos: Todo[] = [
    { id: '1', title: 'Buy milk', createdAt: '2026-01-01T00:00:00Z' },
    { id: '2', title: 'Walk dog', createdAt: '2026-01-01T00:01:00Z' },
  ];

  async function render(items: readonly Todo[], deletingIds = new Set<string>()): Promise<void> {
    fixture.componentRef.setInput('todos', items);
    fixture.componentRef.setInput('deletingIds', deletingIds);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(TodoList);
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders each item in order', async () => {
    await render(todos);

    const titles = Array.from(el.querySelectorAll('.todo-title')).map((t) => t.textContent?.trim());
    expect(titles).toEqual(['Buy milk', 'Walk dog']);
  });

  it('shows an empty state when there are no items', async () => {
    await render([]);

    expect(el.querySelector('ul')).toBeNull();
    expect(el.querySelector('.empty')?.textContent).toContain('Nothing to do yet');
  });

  it('emits the id when delete is clicked', async () => {
    await render(todos);
    const emitted: string[] = [];
    fixture.componentInstance.deleted.subscribe((id) => emitted.push(id));

    (el.querySelector('[aria-label="Delete Walk dog"]') as HTMLButtonElement).click();

    expect(emitted).toEqual(['2']);
  });

  it('disables delete for items being deleted', async () => {
    await render(todos, new Set(['1']));

    const buttons = el.querySelectorAll<HTMLButtonElement>('button.delete');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
  });
});
