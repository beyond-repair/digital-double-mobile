/** Claim-0 in-browser task status stub (pairs with offline FastAPI). */

export type TaskStatusItem = {
  id: string;
  description: string;
  priority: string;
  status: string;
};

export type TaskStatus = TaskStatusItem[];

export type Task = TaskStatusItem;

export class TaskManager {
  private static instance: TaskManager;
  private tasks: TaskStatusItem[] = [
    {
      id: 'demo-1',
      description: 'Claim-0 offline workspace demo',
      priority: 'LOW',
      status: 'created',
    },
  ];

  private constructor() {}

  public static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }

  public registerTask(taskId: string, _taskFn: (...args: unknown[]) => unknown): void {
    this.tasks.push({
      id: taskId,
      description: `registered:${taskId}`,
      priority: 'LOW',
      status: 'registered',
    });
  }

  public executeTask(taskId: string, ..._args: unknown[]): unknown {
    const found = this.tasks.find((t) => t.id === taskId);
    if (!found) {
      throw new Error(`Task ${taskId} not found`);
    }
    return found;
  }

  public async getTaskStatus(): Promise<TaskStatus> {
    return [...this.tasks];
  }

  public async getOverdueTasks(): Promise<Task[]> {
    return [];
  }

  public async autoAssignTasks(): Promise<void> {
    return;
  }
}
