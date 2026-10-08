using Microsoft.AspNetCore.Http.HttpResults;

namespace TodoApi.Todos;

public static class TodoEndpoints
{
    public const string Route = "/api/todos";

    public static IEndpointRouteBuilder MapTodoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup(Route).WithTags("Todos");

        group.MapGet("/", GetAll).WithName("GetTodos");
        group.MapGet("/{id:guid}", GetById).WithName("GetTodoById");
        group.MapPost("/", Create).WithName("CreateTodo");
        group.MapDelete("/{id:guid}", Delete).WithName("DeleteTodo");

        return app;
    }

    internal static Ok<TodoResponse[]> GetAll(ITodoRepository repository) =>
        TypedResults.Ok(repository.GetAll().Select(TodoResponse.From).ToArray());

    internal static Results<Ok<TodoResponse>, NotFound> GetById(Guid id, ITodoRepository repository) =>
        repository.GetById(id) is { } item
            ? TypedResults.Ok(TodoResponse.From(item))
            : TypedResults.NotFound();

    internal static Results<Created<TodoResponse>, ValidationProblem> Create(
        CreateTodoRequest request,
        ITodoRepository repository)
    {
        var title = request.Title?.Trim();

        var error = title switch
        {
            null or "" => "Title is required.",
            { Length: > TodoItem.TitleMaxLength } => $"Title must be {TodoItem.TitleMaxLength} characters or fewer.",
            _ => null,
        };

        if (error is not null)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                ["title"] = [error],
            });
        }

        var item = repository.Add(title!);
        return TypedResults.Created($"{Route}/{item.Id}", TodoResponse.From(item));
    }

    internal static Results<NoContent, NotFound> Delete(Guid id, ITodoRepository repository) =>
        repository.Delete(id) ? TypedResults.NoContent() : TypedResults.NotFound();
}
