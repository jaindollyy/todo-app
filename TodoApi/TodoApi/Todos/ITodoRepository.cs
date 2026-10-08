namespace TodoApi.Todos;

/// <summary>Storage abstraction for TODO items. Swap the implementation for a real database later.</summary>
public interface ITodoRepository
{
    /// <summary>Returns all items, oldest first.</summary>
    IReadOnlyList<TodoItem> GetAll();

    TodoItem? GetById(Guid id);

    /// <summary>Creates and stores a new item. <paramref name="title"/> must already be validated.</summary>
    TodoItem Add(string title);

    /// <summary>Removes the item. Returns <c>false</c> when it does not exist.</summary>
    bool Delete(Guid id);
}
