export type GetUsersQueryDTO = {
    page: number;
    limit: number;
    search?: string;
    status?: "ALL" | "ACTIVE" | "BLOCKED";
}

export type AdminUserListItemDTO = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
    isBlocked: boolean;
    createdAt: Date;
}

export type PaginatedUsersResponseDTO = {
    users: AdminUserListItemDTO[];
    pagination: {
        page: number;
        limit: number;
        totalUsers: number;
        totalPages: number;
    };
}
