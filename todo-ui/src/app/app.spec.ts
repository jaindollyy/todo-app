import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { Todo } from './todos/data/todo.model';

/** Integration test: real store + components, only HTTP is faked. */
describe('App', () => {
  let fixture: ComponentFixture<App>;
  let el: HTMLElement;
  let http: HttpTestingController;

  const url = '/api/todos';
  const milk: Todo = { id: '1', title: 'Buy milk', createdAt: '2026-01-01T00:00:00Z' };
  const dog: Todo = { id: '2', title: 'Walk dog', createdAt: '2026-01-01T00:01:00Z' };

  const titles = () =>
    Array.from(el.querySelectorAll('.todo-title')).map((t) => t.textContent?.trim());

  /** Let the store's pending promises resolve, then let Angular re-render. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(App);
    el = fixture.nativeElement as HTMLElement;

    fixture.detectChanges(); // triggers ngOnInit -> load()
    http.expectOne(url).flush([milk]);
    await settle();
  });

  afterEach(() => http.verify());

  it('loads and shows the list on start', () => {
    expect(titles()).toEqual(['Buy milk']);
    expect(el.querySelector('.count')?.textContent?.trim()).toBe('1 item');
  });

  it('adds an item and clears the input', async () => {
    const input = el.querySelector('input') as HTMLInputElement;
    input.value = 'Walk dog';
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    req.flush(dog);
    await settle();

    expect(titles()).toEqual(['Buy milk', 'Walk dog']);
    expect(input.value).toBe('');
  });

  it('deletes an item', async () => {
    (el.querySelector('[aria-label="Delete Buy milk"]') as HTMLButtonElement).click();

    http.expectOne(`${url}/1`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(titles()).toEqual([]);
    expect(el.querySelector('.empty')).not.toBeNull();
  });

  it('shows an error when a delete fails and clears it on retry', async () => {
    (el.querySelector('[aria-label="Delete Buy milk"]') as HTMLButtonElement).click();
    http.expectOne(`${url}/1`).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Could not delete');

    (el.querySelector('.retry') as HTMLButtonElement).click();
    http.expectOne(url).flush([milk]);
    await settle();

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(titles()).toEqual(['Buy milk']);
  });
});
