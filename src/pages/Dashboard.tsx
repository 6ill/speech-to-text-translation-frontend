import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Clock,
    FileAudio,
    Loader2,
    AlertCircle,
    Languages,
    Mic,
} from "lucide-react";
import { getFilesApi } from "@/api/files";
import { FileRecord, FileStatus, POLLING_STATUSES } from "@/types";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<FileStatus, { label: string; className: string }> =
    {
        uploading: { label: "Uploading", className: "bg-gray-500 text-white" },
        uploaded: { label: "Uploaded", className: "bg-blue-400 text-white" },
        transcribing: { label: "Transcribing", className: "bg-blue-600 text-white" },
        transcribed: { label: "Transcribed", className: "bg-green-600 text-white" },
        translating: { label: "Translating", className: "bg-amber-500 text-white" },
        translated: { label: "Translated", className: "bg-emerald-600 text-white" }
    };

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}


function FileCard({ file }: { file: FileRecord }) {
    const navigate = useNavigate();
    const isProcessing = POLLING_STATUSES.includes(file.status);
    const config = STATUS_CONFIG[file.status];

    const handleAction = () => {
        if (file.status === "transcribed") {
            navigate(`/file/${file.id}/transcribe`);
        } else if (file.status === "translated") {
            navigate(`/file/${file.id}/translate`);
        }
    };

    const canNavigate = file.status === "transcribed" || file.status === "translated";

    return (
        <Card className="border-primary/10 bg-gradient-card hover:shadow-elegant transition-smooth">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-foreground line-clamp-2 leading-snug">
                        {file.file_name}
                    </CardTitle>
                    <Badge
                        className={`shrink-0 border-0 text-xs ${config.className}`}
                    >
                        {isProcessing && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {config.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-2 pb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(file.duration_seconds)}</span>
                    </div>
                    <span>{formatBytes(file.file_size)}</span>
                </div>

                {file.speaker && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mic className="w-3 h-3" />
                        <span>{file.speaker.name}</span>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(file.created_at), {
                        addSuffix: true,
                    })}
                </p>
            </CardContent>

            <CardFooter className="pt-0 flex gap-2">
                {file.status === "translated" && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/file/${file.id}/transcribe`)}
                    >
                        <Mic className="w-3 h-3 mr-1" />
                        Transcription
                    </Button>
                )}
                <Button
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={!canNavigate}
                    onClick={handleAction}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing...
                        </>
                    ) : canNavigate ? (
                        <>
                            <Languages className="w-3 h-3 mr-1" />
                            {file.status === "translated"
                                ? "Translation"
                                : "Open Editor"}
                        </>
                    ) : (
                        "Waiting..."
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

const Dashboard = () => {
    const navigate = useNavigate();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["files"],
        queryFn: () => getFilesApi(1, 50),
        // Poll every 5 seconds if any file is still processing
        refetchInterval: (query) => {
            const files: FileRecord[] = query.state.data?.data ?? [];
            const hasProcessing = files.some((f) =>
                POLLING_STATUSES.includes(f.status),
            );
            return hasProcessing ? 5000 : false;
        },
    });

    const files = data?.data ?? [];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Header row */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">
                            My Files
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your audio files and transcriptions
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate("/upload")}
                        className="gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Upload New
                    </Button>
                </div>

                {/* Loading state */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Loading your files...</p>
                    </div>
                )}

                {/* Error state */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-destructive">
                        <AlertCircle className="w-8 h-8" />
                        <p>Failed to load files. Please try refreshing.</p>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !isError && files.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                        <FileAudio className="w-16 h-16 opacity-30" />
                        <div className="text-center">
                            <p className="text-lg font-medium text-foreground">
                                No files yet
                            </p>
                            <p className="text-sm">
                                Upload an audio or video file to get started.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate("/upload")}
                            variant="outline"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload your first file
                        </Button>
                    </div>
                )}

                {/* File grid */}
                {!isLoading && files.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {files.map((file) => (
                            <FileCard key={file.id} file={file} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
