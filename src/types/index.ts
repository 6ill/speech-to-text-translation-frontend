export type FileStatus =
    | "uploading"
    | "uploaded"
    | "transcribing"
    | "transcribed"
    | "translating"
    | "translated";

export const POLLING_STATUSES: FileStatus[] = [
    "uploading",
    "uploaded",
    "transcribing",
    "translating",
];

export interface SpeakerSummary {
    id: string;
    name: string;
}

export interface FileRecord {
    id: string;
    file_name: string;
    status: FileStatus;
    duration_seconds: number;
    created_at: string;
    file_size: number;
    mime_type: string;
    speaker: SpeakerSummary | null;
}

export interface FileStatusRecord {
    id: string;
    status: FileStatus;
    file_name: string;
    created_at: string;
}

export interface Segment {
    id: string;
    start_timestamp: number;
    end_timestamp: number;
    transcription_text: string;
    translation_text: string | null;
    file_id: string;
}

export interface InferenceResponse {
    file_id: string;
    total_segments: number;
    segments: Segment[];
}

export interface CorrectionSubmit {
    segment_id: string;
    corrected_text: string;
}
export type CorrectionStatus = "pending" | "approved" | "rejected";

export interface CorrectionRecord {
    id: string;
    segment_id: string;
    original_text: string;
    corrected_text: string;
    status: CorrectionStatus;
    start_timestamp: number;
    end_timestamp: number;
    file_id: string;
}

export interface Person {
    id: string;
    name: string;
    email: string;
}

export interface PaginatedResponse<T> {
    message: string;
    data: T[];
    metadata: {
        page: number;
        limit: number;
    };
}
