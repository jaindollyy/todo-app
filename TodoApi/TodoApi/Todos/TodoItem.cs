namespace TodoApi.Todos;

/// <summary>A single entry on the TODO list.</summary>
public sealed record TodoItem(Guid Id, string Title, DateTimeOffset CreatedAt)
{
    public const int TitleMaxLength = 200;
}
