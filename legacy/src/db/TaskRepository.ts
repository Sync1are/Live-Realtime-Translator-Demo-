import { db } from './Database';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../models/Task';
import { generateId } from '../utils/idGenerator';

export class TaskRepository {
  async create(input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId('task'),
      title: input.title,
      description: input.description || '',
      estimatedMinutes: input.estimatedMinutes || 0,
      actualMinutes: 0,
      priority: input.priority || 'medium',
      categories: input.categories || [],
      tags: input.tags || [],
      status: 'not_started',
      createdDate: now,
      startedDate: null,
      completedDate: null,
      isPendingFromYesterday: input.isPendingFromYesterday || false,
      scheduledDate: input.scheduledDate || null,
      scheduledTimeBlock: input.scheduledTimeBlock || null,
      updatedAt: now,
    };

    await db.tasks.add(task);
    return task;
  }

  async update(id: string, updates: UpdateTaskInput): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.tasks.put(updatedTask);
    return updatedTask;
  }

  async delete(id: string): Promise<boolean> {
    await db.tasks.delete(id);
    return true;
  }

  async get(id: string): Promise<Task | undefined> {
    return await db.tasks.get(id);
  }

  async getAll(): Promise<Task[]> {
    return await db.tasks.toArray();
  }

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    return await db.tasks.where('status').equals(status).toArray();
  }

  async getByPriority(priority: TaskPriority): Promise<Task[]> {
    return await db.tasks.where('priority').equals(priority).toArray();
  }

  async getByCategory(category: string): Promise<Task[]> {
    return await db.tasks.where('categories').equals(category).toArray();
  }

  async getPendingFromYesterday(): Promise<Task[]> {
    return await db.tasks.where('isPendingFromYesterday').equals(1).toArray();
  }

  async getScheduledForDate(date: string): Promise<Task[]> {
    return await db.tasks.where('scheduledDate').equals(date).toArray();
  }

  async getIncomplete(): Promise<Task[]> {
    return await db.tasks.where('status').notEqual('completed').toArray();
  }

  async markRollovers(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const incompleteTasks = await this.getIncomplete();

    let updated = 0;
    for (const task of incompleteTasks) {
      const taskDate = task.createdDate.split('T')[0];
      if (taskDate < today && !task.isPendingFromYesterday) {
        await this.update(task.id, { isPendingFromYesterday: true });
        updated++;
      }
    }

    return updated;
  }

  async getAllCategories(): Promise<string[]> {
    const tasks = await this.getAll();
    const categories = new Set<string>();
    tasks.forEach(task => {
      task.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }

  async getAllTags(): Promise<string[]> {
    const tasks = await this.getAll();
    const tags = new Set<string>();
    tasks.forEach(task => {
      task.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    paused: number;
  }> {
    const tasks = await this.getAll();
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      notStarted: tasks.filter(t => t.status === 'not_started').length,
      paused: tasks.filter(t => t.status === 'paused').length,
    };
  }
}

export const taskRepository = new TaskRepository();
