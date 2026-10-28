## How this was built

Built with Claude AI in few hours. I designed the system; the AI wrote the code.

- **Spec first.** I wrote a short spec covering the features, API contract, validation rules
  and folder structure before generating anything, and kept the AI working to it.
- **Architecture.** Repository abstraction, minimal APIs with TypedResults,
  signal store with a container/presentational split. See *Design decisions* below.
- **Tests as the safety net.** xUnit integration tests (WebApplicationFactory) and Vitest
  component tests, run in CI on every push, so AI-generated changes can't silently
  break behaviour.

# TODO List — Angular + .NET

A small full-stack TODO app. Users can **view**, **add** and **delete** items.

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Frontend | Angular 22 (standalone, signals, OnPush, zoneless), Vitest           |
| Backend  | .NET 10 ASP.NET Core Web API (minimal APIs), xUnit, WebApplicationFactory |
| Storage  | In-memory (thread-safe singleton) — data resets when the API restarts |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- Node.js `22.22.3+` or `24.15+` (required by Angular 22)

## Run it

Two terminals, from the repo root.

**1. API** — listens on `http://localhost:5080`

```bash
cd TodoApi
dotnet run --project TodoApi
```

Or open `TodoApi/TodoApi.slnx` in Visual Studio and run the **http** profile.

**2. Frontend** — open `http://localhost:4200`

```bash
cd todo-ui
npm install
npm start
```

The Angular dev server proxies `/api/*` to `http://localhost:5080` (see `todo-ui/proxy.conf.json`), so no CORS setup is needed in development. If you change the API port, update `proxy.conf.json` and `launchSettings.json` together.

OpenAPI document (Development only): `http://localhost:5080/openapi/v1.json`

## Test it

```bash
# Backend: unit + HTTP integration tests
cd TodoApi
dotnet test

# Frontend: unit + component tests (Vitest, single run)
cd todo-ui
npm run test:ci
```

CI runs both suites on every push and PR (`.github/workflows/ci.yml`).

## API

| Method | Route             | Success          | Errors                        |
| ------ | ----------------- | ---------------- | ----------------------------- |
| GET    | `/api/todos`      | `200` list       |                               |
| GET    | `/api/todos/{id}` | `200` item       | `404`                         |
| POST   | `/api/todos`      | `201` + Location | `400` ValidationProblemDetails |
| DELETE | `/api/todos/{id}` | `204`            | `404`                         |

Body for POST: `{ "title": "Buy milk" }` — trimmed, required, max 200 characters.

## Structure

```
TodoApi/                          # .NET solution (TodoApi.slnx)
  TodoApi/
    Program.cs                    # composition root: DI, CORS, ProblemDetails, OpenAPI
    Todos/
      TodoItem.cs                 # domain record
      ITodoRepository.cs          # storage abstraction
      InMemoryTodoRepository.cs   # thread-safe in-memory implementation
      TodoContracts.cs            # request/response DTOs
      TodoEndpoints.cs            # HTTP endpoints + validation
  TodoApi.Tests/                  # repository unit tests + endpoint integration tests

todo-ui/src/app/                  # Angular app
  app.ts                          # container: connects store to UI
  todos/
    data/
      todo-api.service.ts         # HTTP only
      todo.store.ts               # signal state, loading/saving/error handling
    todo-form/                    # presentational: input + validation, emits title
    todo-list/                    # presentational: renders list, emits delete
```

## Design decisions

- **Feature folder + repository abstraction.** Endpoints depend on `ITodoRepository`, so swapping in EF Core / a real database is a one-line DI change with no endpoint changes.
- **Minimal APIs with `TypedResults`.** Response types are compile-time checked and show up correctly in OpenAPI.
- **Validation on both sides.** The API is the source of truth (trim, required, max length → `400` ValidationProblemDetails); the UI validates the same rules for fast feedback and shows the server message if it still gets a 400.
- **RFC 7807 errors.** `AddProblemDetails` + `UseExceptionHandler` give consistent JSON error responses.
- **`TimeProvider` injected** so timestamps are deterministic in tests.
- **Frontend: container/presentational split.** Components are dumb and easy to test; all state and side effects live in `TodoStore` (signals). The UI only updates after the API confirms, and a `404` on delete is treated as "already gone".
- **Accessibility.** Labelled input, `aria-invalid`, live error region, per-item delete labels, keyboard-friendly native controls, dark mode via `prefers-color-scheme`.

## Production notes

- Data is in memory by design (per the brief). Replace `InMemoryTodoRepository` with a persistent implementation for real use.
- In production, serve the built frontend from the same origin as the API, or set `Cors:AllowedOrigins` in configuration and provide `API_BASE_URL` in `app.config.ts`.
