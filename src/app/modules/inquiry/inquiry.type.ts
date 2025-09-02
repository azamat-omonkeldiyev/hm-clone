export interface QueryParams {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export interface StatusBody {
    status: 'pending' | 'assigned' | 'resolved';
}

export interface AssignBody {
    userId: string;
}