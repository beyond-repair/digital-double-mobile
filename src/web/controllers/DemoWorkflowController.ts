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
        this.taskManager = new TaskManager();
        this.financialAnalyzer = new FinancialAnalyzer();
        this.arVisualizer = new ARVisualizer();
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
}
