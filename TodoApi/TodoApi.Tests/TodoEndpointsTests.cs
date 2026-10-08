using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using TodoApi.Todos;

namespace TodoApi.Tests;

/// <summary>
/// End-to-end tests through the real HTTP pipeline (routing, model binding, JSON, status codes).
/// Each test creates its own factory so the in-memory store starts empty.
/// </summary>
public sealed class TodoEndpointsTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory = new();
    private readonly HttpClient _client;

    public TodoEndpointsTests()
    {
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task GetAll_WhenEmpty_ReturnsOkWithEmptyArray()
    {
        var response = await _client.GetAsync(TodoEndpoints.Route);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var todos = await response.Content.ReadFromJsonAsync<TodoResponse[]>();
        Assert.NotNull(todos);
        Assert.Empty(todos);
    }

    [Fact]
    public async Task Create_ValidTitle_Returns201WithLocationAndTrimmedTitle()
    {
        var response = await _client.PostAsJsonAsync(TodoEndpoints.Route, new CreateTodoRequest("  Buy milk  "));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<TodoResponse>();
        Assert.NotNull(created);
        Assert.Equal("Buy milk", created.Title);
        Assert.Equal($"{TodoEndpoints.Route}/{created.Id}", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task Create_ThenGetAll_ReturnsItemsInOrder()
    {
        var first = await CreateAsync("First");
        var second = await CreateAsync("Second");

        var todos = await _client.GetFromJsonAsync<TodoResponse[]>(TodoEndpoints.Route);

        Assert.Equal(new[] { first, second }, todos);
    }

    [Fact]
    public async Task GetById_ExistingItem_ReturnsIt()
    {
        var created = await CreateAsync("Walk dog");

        var fetched = await _client.GetFromJsonAsync<TodoResponse>($"{TodoEndpoints.Route}/{created.Id}");

        Assert.Equal(created, fetched);
    }

    [Fact]
    public async Task GetById_UnknownItem_Returns404()
    {
        var response = await _client.GetAsync($"{TodoEndpoints.Route}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("    ")]
    public async Task Create_MissingOrBlankTitle_Returns400ValidationProblem(string? title)
    {
        var response = await _client.PostAsJsonAsync(TodoEndpoints.Route, new CreateTodoRequest(title));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("title", problem.Errors.Keys);
        Assert.Empty(await _client.GetFromJsonAsync<TodoResponse[]>(TodoEndpoints.Route) ?? []);
    }

    [Fact]
    public async Task Create_TitleTooLong_Returns400()
    {
        var title = new string('a', TodoItem.TitleMaxLength + 1);

        var response = await _client.PostAsJsonAsync(TodoEndpoints.Route, new CreateTodoRequest(title));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_TitleAtMaxLength_Returns201()
    {
        var title = new string('a', TodoItem.TitleMaxLength);

        var response = await _client.PostAsJsonAsync(TodoEndpoints.Route, new CreateTodoRequest(title));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ExistingItem_Returns204AndRemovesIt()
    {
        var keep = await CreateAsync("Keep");
        var remove = await CreateAsync("Remove");

        var response = await _client.DeleteAsync($"{TodoEndpoints.Route}/{remove.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(new[] { keep }, await _client.GetFromJsonAsync<TodoResponse[]>(TodoEndpoints.Route));
    }

    [Fact]
    public async Task Delete_UnknownItem_Returns404()
    {
        var response = await _client.DeleteAsync($"{TodoEndpoints.Route}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_InvalidId_Returns404()
    {
        // The {id:guid} route constraint rejects non-GUIDs before the handler runs.
        var response = await _client.DeleteAsync($"{TodoEndpoints.Route}/not-a-guid");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<TodoResponse> CreateAsync(string title)
    {
        var response = await _client.PostAsJsonAsync(TodoEndpoints.Route, new CreateTodoRequest(title));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TodoResponse>())!;
    }
}
