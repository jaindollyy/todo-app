import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, TodoApiService } from './todo-api.service';
import { Todo } from './todo.model';

describe('TodoApiService', () => {
  let service: TodoApiService;
  let http: HttpTestingController;

  const todo: Todo = { id: 'abc', title: 'Buy milk', createdAt: '2026-01-01T00:00:00Z' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test/api' },
      ],
    });
    service = TestBed.inject(TodoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() GETs the todos endpoint', () => {
    let result: Todo[] | undefined;
    service.getAll().subscribe((todos) => (result = todos));

    const req = http.expectOne('http://test/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([todo]);

    expect(result).toEqual([todo]);
  });

  it('create() POSTs the request body', () => {
    let result: Todo | undefined;
    service.create({ title: 'Buy milk' }).subscribe((created) => (result = created));

    const req = http.expectOne('http://test/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Buy milk' });
    req.flush(todo);

    expect(result).toEqual(todo);
  });

  it('delete() DELETEs by encoded id', () => {
    let completed = false;
    service.delete('a/b').subscribe({ complete: () => (completed = true) });

    const req = http.expectOne('http://test/api/todos/a%2Fb');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
