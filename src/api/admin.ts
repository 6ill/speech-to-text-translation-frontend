import apiClient from "@/lib/axios";

export interface AdminStats {
    total_users: number;
    total_files: number;
    total_speakers: number;
    pending_corrections: number;
}

export async function getAdminStatsApi(): Promise<{ message: string; data: AdminStats }> {
    const res = await apiClient.get("/admin/stats");
    return res.data;
}