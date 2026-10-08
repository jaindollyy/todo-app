namespace TodoApi.Todos;

/// <summary>Request body for creating an item.</summary>
public sealed record CreateTodoRequest(string? Title);

/// <summary>API shape of an item. Kept separate from the domain record so the two can evolve independently.</summary>
public sealed record TodoResponse(Guid Id, string Title, DateTimeOffset CreatedAt)
{
    public static TodoResponse From(TodoItem item) => new(item.Id, item.Title, item.CreatedAt);
}
