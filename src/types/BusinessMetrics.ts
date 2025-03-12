export interface BusinessMetrics {
    salesThisWeek: number;
    salesTrend: number;
    activeTasks: {
        inProgress: number;
        overdue: number;
    };
    topExpense: {
        category: string;
        amount: number;
    };
    pendingInvoices: {
        count: number;
        total: number;
    };
}

export interface TaskStatus {
    id: string;
    title: string;
    assignee?: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}
