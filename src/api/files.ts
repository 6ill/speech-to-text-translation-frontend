import apiClient from "@/lib/axios";
import {
    FileRecord,
    FileStatusRecord,
    InferenceResponse,
    CorrectionSubmit,
    Person,
    PaginatedResponse,
} from "@/types";

export async function getFilesApi(
    page = 1,
    limit = 20,
): Promise<PaginatedResponse<FileRecord>> {
    const res = await apiClient.get("/files/", { params: { page, limit } });
    return res.data;
}

export async function getFileByIdApi(
    fileId: string,
): Promise<{ data: FileRecord }> {
    const res = await apiClient.get(`/files/${fileId}`);
    return res.data;
}

export async function getFileStatusApi(
    fileId: string,
): Promise<{ data: FileStatusRecord }> {
    const res = await apiClient.get(`/files/${fileId}/status`);
    return res.data;
}

export async function getFileUrlApi(
    fileId: string,
): Promise<{
    data: { file_id: string; download_url: string; expires_in_seconds: number };
}> {
    const res = await apiClient.get(`/files/${fileId}/url`);
    return res.data;
}

export async function uploadFileApi(
    file: File,
    speakerId: string | null,
    onUploadProgress?: (percent: number) => void,
): Promise<{ data: FileRecord }> {
    const formData = new FormData();
    formData.append("file", file);
    if (speakerId) {
        formData.append("speaker_id", speakerId);
    }

    const res = await apiClient.post("/files/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
            if (event.total && onUploadProgress) {
                onUploadProgress(
                    Math.round((event.loaded * 100) / event.total),
                );
            }
        },
    });

    return res.data;
}

export async function deleteFileApi(fileId: string): Promise<void> {
    await apiClient.delete(`/files/${fileId}`);
}


export async function getSegmentsApi(
    fileId: string,
): Promise<{ message: string; data: InferenceResponse }> {
    const res = await apiClient.get(`/inference/${fileId}`);
    return res.data;
}

export async function triggerTranslationApi(
    fileId: string,
): Promise<{ data: { file_id: string; status: string } }> {
    const res = await apiClient.post(`/inference/${fileId}/translate`);
    return res.data;
}

export async function submitTranscriptionCorrectionsApi(
    corrections: CorrectionSubmit[],
): Promise<void> {
    await apiClient.post("/corrections/transcription", corrections);
}

export async function submitTranslationCorrectionsApi(
    corrections: CorrectionSubmit[],
): Promise<void> {
    await apiClient.post("/corrections/translation", corrections);
}

export async function getPeopleApi(): Promise<{ data: Person[] }> {
    const res = await apiClient.get("/people/");
    return res.data;
}
