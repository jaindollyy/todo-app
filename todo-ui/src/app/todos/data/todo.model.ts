/** Matches the API's TodoResponse. */
export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
}

export interface CreateTodoRequest {
  readonly title: string;
}

/** Keep in sync with TodoItem.TitleMaxLength on the API. */
export const TODO_TITLE_MAX_LENGTH = 200;
