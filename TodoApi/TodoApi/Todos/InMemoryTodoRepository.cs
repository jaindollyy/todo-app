namespace TodoApi.Todos;

/// <summary>
/// Thread-safe in-memory store. Registered as a singleton, so data lives for the lifetime of the process.
/// A list (not a dictionary) is used so insertion order is preserved for display.
/// </summary>
public sealed class InMemoryTodoRepository(TimeProvider timeProvider) : ITodoRepository
{
    private readonly List<TodoItem> _items = [];
    private readonly Lock _gate = new();

    public IReadOnlyList<TodoItem> GetAll()
    {
        lock (_gate)
        {
            return _items.ToArray();
        }
    }

    public TodoItem? GetById(Guid id)
    {
        lock (_gate)
        {
            return _items.Find(item => item.Id == id);
        }
    }

    public TodoItem Add(string title)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        var item = new TodoItem(Guid.NewGuid(), title, timeProvider.GetUtcNow());

        lock (_gate)
        {
            _items.Add(item);
        }

        return item;
    }

    public bool Delete(Guid id)
    {
        lock (_gate)
        {
            return _items.RemoveAll(item => item.Id == id) > 0;
        }
    }
}
