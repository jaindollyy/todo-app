import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoForm } from './todo-form';

describe('TodoForm', () => {
  let fixture: ComponentFixture<TodoForm>;
  let el: HTMLElement;
  let emitted: string[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(TodoForm);
    el = fixture.nativeElement as HTMLElement;
    emitted = [];
    fixture.componentInstance.submitted.subscribe((title) => emitted.push(title));
    await fixture.whenStable();
  });

  const input = () => el.querySelector('input') as HTMLInputElement;
  const button = () => el.querySelector('button[type="submit"]') as HTMLButtonElement;
  const errorText = () => el.querySelector('.field-error')?.textContent?.trim() ?? '';

  async function type(value: string): Promise<void> {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('emits the trimmed title on submit', async () => {
    await type('  Buy milk  ');
    await submit();

    expect(emitted).toEqual(['Buy milk']);
  });

  it('does not emit and shows an error for a blank title', async () => {
    await type('   ');
    await submit();

    expect(emitted).toEqual([]);
    expect(errorText()).toBe('Please enter something to do.');
  });

  it('does not emit and shows an error when too long', async () => {
    await type('a'.repeat(201));
    await submit();

    expect(emitted).toEqual([]);
    expect(errorText()).toContain('200 characters');
  });

  it('disables the button and does not emit while busy', async () => {
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    await type('Buy milk');
    await submit();

    expect(button().disabled).toBe(true);
    expect(button().textContent?.trim()).toBe('Adding…');
    expect(emitted).toEqual([]);
  });

  it('reset() clears the input', async () => {
    await type('Buy milk');

    fixture.componentInstance.reset();
    await fixture.whenStable();

    expect(input().value).toBe('');
  });
});
