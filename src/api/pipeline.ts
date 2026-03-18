import apiClient from "@/lib/axios";

export type PipelineTaskType = "asr" | "mt";
export type PipelineRunStatus = "running" | "success" | "failed" | "skipped";

export interface PipelineConfig {
    id: string;
    task_type: PipelineTaskType;
    is_active: boolean;
    cron_schedule: string;
    min_samples_required: number;
    learning_rate: number;
    num_epochs: number;
    batch_size: number;
    evaluation_dataset_storage_key: string;
    updated_at: string;
}

export interface PipelineConfigUpdate {
    is_active?: boolean;
    cron_schedule?: string;
    min_samples_required?: number;
    learning_rate?: number;
    num_epochs?: number;
    batch_size?: number;
    evaluation_dataset_storage_key?: string;
}

export interface PipelineRunLog {
    id: string;
    config_id: string;
    task_type: PipelineTaskType;
    mlflow_run_id: string | null;
    status: PipelineRunStatus;
    data_samples_used: number;
    metrics_baseline: Record<string, number> | null;
    metrics_new_model: Record<string, number> | null;
    message: string | null;
    start_time: string;
    end_time: string | null;
}

export async function getPipelineConfigsApi(): Promise<{
    message: string;
    data: PipelineConfig[];
}> {
    const res = await apiClient.get("/pipeline/config");
    return res.data;
}

export async function updatePipelineConfigApi(
    taskType: PipelineTaskType,
    data: PipelineConfigUpdate,
): Promise<{ message: string; data: PipelineConfig }> {
    const res = await apiClient.patch(`/pipeline/config/${taskType}`, data);
    return res.data;
}

export async function triggerPipelineApi(
    taskType: PipelineTaskType,
): Promise<{ task_id: string; message: string; task_type: string }> {
    const res = await apiClient.post(`/pipeline/trigger/${taskType}`);
    return res.data;
}

export async function getPipelineRunsApi(params?: {
    task_type?: PipelineTaskType;
    limit?: number;
}): Promise<{ message: string; data: PipelineRunLog[] }> {
    const res = await apiClient.get("/pipeline/runs", { params });
    return res.data;
}