export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  category: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  color: string;
  allDay: boolean;
  reminder: number; // minutes before
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  folders: string[];
  color: string;
  createdAt: string;
}

export const productivityService = {
  // ─── Notes ───────────────────────────────────────────────────────────────
  getNotes(userId: string): Note[] {
    try {
      const raw = localStorage.getItem(`notes_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  createNote(userId: string, note: Omit<Note, "id" | "createdAt" | "updatedAt">): Note {
    const notes = this.getNotes(userId);
    const newNote: Note = {
      ...note,
      id: "note_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    localStorage.setItem(`notes_${userId}`, JSON.stringify(notes));
    return newNote;
  },

  updateNote(userId: string, noteId: string, updates: Partial<Note>): Note | null {
    const notes = this.getNotes(userId);
    const idx = notes.findIndex((n) => n.id === noteId);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(`notes_${userId}`, JSON.stringify(notes));
    return notes[idx];
  },

  deleteNote(userId: string, noteId: string): void {
    const notes = this.getNotes(userId);
    localStorage.setItem(`notes_${userId}`, JSON.stringify(notes.filter((n) => n.id !== noteId)));
  },

  // ─── Todo List ───────────────────────────────────────────────────────────
  getTodos(userId: string): TodoItem[] {
    try {
      const raw = localStorage.getItem(`todos_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  createTodo(userId: string, todo: Omit<TodoItem, "id" | "createdAt">): TodoItem {
    const todos = this.getTodos(userId);
    const newTodo: TodoItem = {
      ...todo,
      id: "todo_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    todos.unshift(newTodo);
    localStorage.setItem(`todos_${userId}`, JSON.stringify(todos));
    return newTodo;
  },

  updateTodo(userId: string, todoId: string, updates: Partial<TodoItem>): TodoItem | null {
    const todos = this.getTodos(userId);
    const idx = todos.findIndex((t) => t.id === todoId);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], ...updates };
    localStorage.setItem(`todos_${userId}`, JSON.stringify(todos));
    return todos[idx];
  },

  deleteTodo(userId: string, todoId: string): void {
    const todos = this.getTodos(userId);
    localStorage.setItem(`todos_${userId}`, JSON.stringify(todos.filter((t) => t.id !== todoId)));
  },

  toggleTodo(userId: string, todoId: string): TodoItem | null {
    const todos = this.getTodos(userId);
    const idx = todos.findIndex((t) => t.id === todoId);
    if (idx === -1) return null;
    todos[idx].completed = !todos[idx].completed;
    localStorage.setItem(`todos_${userId}`, JSON.stringify(todos));
    return todos[idx];
  },

  // ─── Calendar ────────────────────────────────────────────────────────────
  getEvents(userId: string): CalendarEvent[] {
    try {
      const raw = localStorage.getItem(`calendar_events_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  createEvent(userId: string, event: Omit<CalendarEvent, "id">): CalendarEvent {
    const events = this.getEvents(userId);
    const newEvent: CalendarEvent = {
      ...event,
      id: "evt_" + Math.random().toString(36).substring(2, 15),
    };
    events.push(newEvent);
    localStorage.setItem(`calendar_events_${userId}`, JSON.stringify(events));
    return newEvent;
  },

  updateEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const events = this.getEvents(userId);
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...updates };
    localStorage.setItem(`calendar_events_${userId}`, JSON.stringify(events));
    return events[idx];
  },

  deleteEvent(userId: string, eventId: string): void {
    const events = this.getEvents(userId);
    localStorage.setItem(`calendar_events_${userId}`, JSON.stringify(events.filter((e) => e.id !== eventId)));
  },

  // ─── Reminders ───────────────────────────────────────────────────────────
  getReminders(userId: string): Reminder[] {
    try {
      const raw = localStorage.getItem(`reminders_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  createReminder(userId: string, reminder: Omit<Reminder, "id" | "createdAt">): Reminder {
    const reminders = this.getReminders(userId);
    const newReminder: Reminder = {
      ...reminder,
      id: "rem_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    reminders.unshift(newReminder);
    localStorage.setItem(`reminders_${userId}`, JSON.stringify(reminders));
    return newReminder;
  },

  completeReminder(userId: string, reminderId: string): void {
    const reminders = this.getReminders(userId);
    const idx = reminders.findIndex((r) => r.id === reminderId);
    if (idx !== -1) {
      reminders[idx].completed = true;
      localStorage.setItem(`reminders_${userId}`, JSON.stringify(reminders));
    }
  },

  deleteReminder(userId: string, reminderId: string): void {
    const reminders = this.getReminders(userId);
    localStorage.setItem(`reminders_${userId}`, JSON.stringify(reminders.filter((r) => r.id !== reminderId)));
  },

  // ─── Favorite Workspaces ─────────────────────────────────────────────────
  getWorkspaces(userId: string): Workspace[] {
    try {
      const raw = localStorage.getItem(`workspaces_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  createWorkspace(userId: string, workspace: Omit<Workspace, "id" | "createdAt">): Workspace {
    const workspaces = this.getWorkspaces(userId);
    const newWorkspace: Workspace = {
      ...workspace,
      id: "ws_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    workspaces.push(newWorkspace);
    localStorage.setItem(`workspaces_${userId}`, JSON.stringify(workspaces));
    return newWorkspace;
  },

  deleteWorkspace(userId: string, workspaceId: string): void {
    const workspaces = this.getWorkspaces(userId);
    localStorage.setItem(`workspaces_${userId}`, JSON.stringify(workspaces.filter((w) => w.id !== workspaceId)));
  },

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────────
  getShortcuts(): { key: string; description: string; category: string }[] {
    return [
      { key: "Ctrl + K", description: "Open Command Palette", category: "General" },
      { key: "Ctrl + N", description: "New Note", category: "Notes" },
      { key: "Ctrl + T", description: "New Todo", category: "Todos" },
      { key: "Ctrl + F", description: "Search Files", category: "Files" },
      { key: "Ctrl + D", description: "Toggle Dark Mode", category: "General" },
      { key: "Ctrl + E", description: "Toggle AI Mode", category: "AI" },
      { key: "Ctrl + L", description: "Focus Search Bar", category: "General" },
      { key: "Ctrl + U", description: "Upload File", category: "Files" },
      { key: "Ctrl + B", description: "Toggle Sidebar", category: "General" },
      { key: "Escape", description: "Close Modals / Panels", category: "General" },
      { key: "Ctrl + Shift + T", description: "Open Trash", category: "Files" },
      { key: "Ctrl + Shift + H", description: "Open Hidden Vault", category: "Security" },
      { key: "Ctrl + Shift + S", description: "Open Sharing", category: "Sharing" },
      { key: "Ctrl + 1-9", description: "Navigate to Pinned Folders", category: "Navigation" },
    ];
  },
};