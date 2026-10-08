import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Todo } from './todo.model';
import { TodoStore } from './todo.store';

describe('TodoStore', () => {
  let store: TodoStore;
  let http: HttpTestingController;

  const url = '/api/todos';
  const milk: Todo = { id: '1', title: 'Buy milk', createdAt: '2026-01-01T00:00:00Z' };
  const dog: Todo = { id: '2', title: 'Walk dog', createdAt: '2026-01-01T00:01:00Z' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TodoStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function seed(todos: Todo[]): Promise<void> {
    const loading = store.load();
    http.expectOne(url).flush(todos);
    await loading;
  }

  describe('load()', () => {
    it('populates todos and toggles loading', async () => {
      const loading = store.load();
      expect(store.loading()).toBe(true);

      http.expectOne(url).flush([milk, dog]);
      await loading;

      expect(store.loading()).toBe(false);
      expect(store.todos()).toEqual([milk, dog]);
      expect(store.count()).toBe(2);
      expect(store.error()).toBeNull();
    });

    it('sets an error when the request fails', async () => {
      const loading = store.load();
      http.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });
      await loading;

      expect(store.loading()).toBe(false);
      expect(store.todos()).toEqual([]);
      expect(store.error()).toContain('Could not load');
    });
  });

  describe('add()', () => {
    it('trims the title, appends the created item and returns true', async () => {
      await seed([milk]);

      const adding = store.add('  Walk dog  ');
      expect(store.saving()).toBe(true);

      const req = http.expectOne(url);
      expect(req.request.body).toEqual({ title: 'Walk dog' });
      req.flush(dog);

      expect(await adding).toBe(true);
      expect(store.saving()).toBe(false);
      expect(store.todos()).toEqual([milk, dog]);
    });

    it('ignores blank titles without calling the API', async () => {
      expect(await store.add('   ')).toBe(false);
      http.expectNone(url);
    });

    it('shows the server validation message on 400', async () => {
      const adding = store.add('x');
      http
        .expectOne(url)
        .flush(
          { errors: { title: ['Title must be 200 characters or fewer.'] } },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await adding).toBe(false);
      expect(store.error()).toBe('Title must be 200 characters or fewer.');
      expect(store.todos()).toEqual([]);
    });

    it('shows a generic message on other failures', async () => {
      const adding = store.add('x');
      http.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });

      expect(await adding).toBe(false);
      expect(store.error()).toContain('Could not add');
    });
  });

  describe('remove()', () => {
    it('removes the item after the API confirms', async () => {
      await seed([milk, dog]);

      const removing = store.remove('1');
      expect(store.deletingIds().has('1')).toBe(true);
      expect(store.todos()).toEqual([milk, dog]);

      const req = http.expectOne(`${url}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await removing;

      expect(store.todos()).toEqual([dog]);
      expect(store.deletingIds().has('1')).toBe(false);
    });

    it('treats 404 as already deleted', async () => {
      await seed([milk]);

      const removing = store.remove('1');
      http.expectOne(`${url}/1`).flush(null, { status: 404, statusText: 'Not Found' });
      await removing;

      expect(store.todos()).toEqual([]);
      expect(store.error()).toBeNull();
    });

    it('keeps the item and shows an error on other failures', async () => {
      await seed([milk]);

      const removing = store.remove('1');
      http.expectOne(`${url}/1`).flush(null, { status: 500, statusText: 'Server Error' });
      await removing;

      expect(store.todos()).toEqual([milk]);
      expect(store.error()).toContain('Could not delete');
      expect(store.deletingIds().size).toBe(0);
    });

    it('ignores a second delete for the same item while one is in flight', async () => {
      await seed([milk]);

      const first = store.remove('1');
      await store.remove('1');

      http.expectOne(`${url}/1`).flush(null, { status: 204, statusText: 'No Content' });
      await first;

      expect(store.todos()).toEqual([]);
    });
  });
});
