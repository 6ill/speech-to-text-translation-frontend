import apiClient from "@/lib/axios";
import { CorrectionRecord, Person } from "@/types";

export type TaskType = "transcription" | "translation";
export type ReviewAction = "approve" | "reject" | "reset";

// ─── Corrections ──────────────────────────────────────────────────────────────

export async function getCorrectionsApi(
    taskType: TaskType,
    fileId: string,
    status?: "pending" | "approved" | "rejected",
): Promise<{ message: string; data: CorrectionRecord[] }> {
    const res = await apiClient.get(`/corrections/${taskType}`, {
        params: {
            file_id: fileId,
            ...(status ? { status } : {}),
        },
    });
    return res.data;
}

export async function reviewCorrectionsApi(
    taskType: TaskType,
    correctionIds: string[],
    action: ReviewAction,
): Promise<{ message: string; data: { updated_count: number; action: ReviewAction } }> {
    const res = await apiClient.post(`/corrections/${taskType}/review`, {
        correction_ids: correctionIds,
        action,
    });
    return res.data;
}

// ─── People ───────────────────────────────────────────────────────────────────

export async function createPersonApi(
    data: { name: string; email: string },
): Promise<{ message: string; data: Person }> {
    const res = await apiClient.post("/people/", data);
    return res.data;
}

export async function updatePersonApi(
    personId: string,
    data: { name?: string; email?: string },
): Promise<{ message: string; data: Person }> {
    const res = await apiClient.patch(`/people/${personId}`, data);
    return res.data;
}

export async function deletePersonApi(personId: string): Promise<void> {
    await apiClient.delete(`/people/${personId}`);
}