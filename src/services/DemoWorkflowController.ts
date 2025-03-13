import { DeepSeatAI } from './DeepSeatAI';
import { TaskManager } from './TaskManager';
import { FinancialAnalyzer } from './FinancialAnalyzer';
import { ARVisualizer } from '../components/ARVisualizer';

export class DemoWorkflowController {
    private ai: DeepSeatAI;
    private taskManager: TaskManager;
    private financialAnalyzer: FinancialAnalyzer;
    private arVisualizer: ARVisualizer;

    constructor() {
        this.ai = new DeepSeatAI();
        this.taskManager = TaskManager.getInstance();
        this.financialAnalyzer = new FinancialAnalyzer();
        this.arVisualizer = ARVisualizer.getInstance();
    }

    async startDemo() {
        await this.ai.initialize();
        const greeting = await this.ai.getGreeting('Alex');
        return greeting;
    }

    async getBusinessOverview() {
        const metrics = await this.financialAnalyzer.getDailyMetrics();
        return {
            salesThisWeek: metrics.sales,
            activeTasks: await this.taskManager.getTaskStatus(),
            topExpense: metrics.topExpense,
            pendingInvoices: metrics.unpaidInvoices
        };
    }

    async handleTaskReassignment() {
        const overdueTasks = await this.taskManager.getOverdueTasks();
        return await this.taskManager.autoAssignTasks(overdueTasks);
    }

    public async handleDailyTasks(): Promise<void> {
        // Get financial metrics using static method
        const metrics = await FinancialAnalyzer.getDailyMetrics();
        
        // Get task status using instance method
        const taskStatus = await this.taskManager.getTaskStatus();
        
        // Use instance methods for task management
        const overdueTasks = await this.taskManager.getOverdueTasks();
        await this.taskManager.autoAssignTasks();
    }
}
