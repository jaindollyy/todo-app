using TodoApi.Todos;

namespace TodoApi.Tests;

public sealed class InMemoryTodoRepositoryTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 9, 0, 0, TimeSpan.Zero);

    private readonly InMemoryTodoRepository _sut = new(new FixedTimeProvider(Now));

    [Fact]
    public void GetAll_WhenEmpty_ReturnsEmptyList()
    {
        Assert.Empty(_sut.GetAll());
    }

    [Fact]
    public void Add_StoresItemWithIdTitleAndTimestamp()
    {
        var item = _sut.Add("Buy milk");

        Assert.NotEqual(Guid.Empty, item.Id);
        Assert.Equal("Buy milk", item.Title);
        Assert.Equal(Now, item.CreatedAt);
        Assert.Equal(new[] { item }, _sut.GetAll());
    }

    [Fact]
    public void GetAll_ReturnsItemsInInsertionOrder()
    {
        var first = _sut.Add("First");
        var second = _sut.Add("Second");
        var third = _sut.Add("Third");

        Assert.Equal(new[] { first, second, third }, _sut.GetAll());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Add_WithBlankTitle_Throws(string title)
    {
        Assert.Throws<ArgumentException>(() => _sut.Add(title));
    }

    [Fact]
    public void GetById_ReturnsMatchingItemOrNull()
    {
        var item = _sut.Add("Walk dog");

        Assert.Equal(item, _sut.GetById(item.Id));
        Assert.Null(_sut.GetById(Guid.NewGuid()));
    }

    [Fact]
    public void Delete_ExistingItem_RemovesOnlyThatItem()
    {
        var keep = _sut.Add("Keep");
        var remove = _sut.Add("Remove");

        var deleted = _sut.Delete(remove.Id);

        Assert.True(deleted);
        Assert.Equal(new[] { keep }, _sut.GetAll());
    }

    [Fact]
    public void Delete_UnknownId_ReturnsFalse()
    {
        _sut.Add("Keep");

        Assert.False(_sut.Delete(Guid.NewGuid()));
        Assert.Single(_sut.GetAll());
    }

    [Fact]
    public void GetAll_ReturnsSnapshot_NotLiveView()
    {
        var snapshot = _sut.GetAll();

        _sut.Add("Added later");

        Assert.Empty(snapshot);
    }

    [Fact]
    public async Task Add_IsThreadSafe()
    {
        const int count = 500;

        await Task.WhenAll(Enumerable.Range(0, count)
            .Select(i => Task.Run(() => _sut.Add($"Item {i}"))));

        Assert.Equal(count, _sut.GetAll().Count);
    }
}
