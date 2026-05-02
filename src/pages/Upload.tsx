import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Upload,
    FileAudio,
    X,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPeopleApi, uploadFileApi } from "@/api/files";

const ACCEPTED_TYPES = [
    "audio/mpeg", // .mp3
    "audio/wav", // .wav
    "audio/x-m4a", // .m4a
    "audio/m4a",
    "audio/ogg", // .ogg
    "video/mp4", // .mp4
    "video/webm",
];
const ACCEPTED_AUDIO_EXTS = [".mp3", ".wav", ".m4a", ".ogg"];
const ACCEPTED_VIDEO_EXTS = [".mp4", ".mov", ".avi", ".mkv"];
const ACCEPTED_EXTENSIONS = [...ACCEPTED_AUDIO_EXTS, ...ACCEPTED_VIDEO_EXTS].join(",");
const MAX_AUDIO_SIZE_MB = 500;
const MAX_VIDEO_SIZE_MB = 2000;

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renameFile(file: File, newName: string): File {
    return new File([file], newName, {
        type: file.type,
        lastModified: file.lastModified,
    });
}


const UploadPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [projectTitle, setProjectTitle] = useState("");
    const [speakerId, setSpeakerId] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    
    const [autoTranslate, setAutoTranslate] = useState(false);

    // Fetch speaker list for dropdown
    const { data: peopleData } = useQuery({
        queryKey: ["people"],
        queryFn: getPeopleApi,
    });
    const speakers = peopleData?.data ?? [];

    const validateFile = (file: File): string | null => {
        const fileName = file.name.toLowerCase();
        const isAudio = ACCEPTED_AUDIO_EXTS.some(ext => fileName.endsWith(ext));
        const isVideo = ACCEPTED_VIDEO_EXTS.some(ext => fileName.endsWith(ext));

        if (!isAudio && !isVideo) {
            return "Unsupported file format. Please use MP3, WAV, M4A, OGG for audio, or MP4, MOV, AVI, MKV for video.";
        }

        if (isAudio && file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
            return `Audio file size too large. Maximum ${MAX_AUDIO_SIZE_MB} MB.`;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            return `Video file size too large. Maximum 2 GB.`;
        }

        return null;
    };

    const handleFileSelect = (file: File) => {
        const error = validateFile(file);
        if (error) {
            toast({
                title: "File is invalid",
                description: error,
                variant: "destructive",
            });
            return;
        }
        setSelectedFile(file);
        if (!projectTitle) {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            setProjectTitle(nameWithoutExt);
        }
        setUploadDone(false);
        setUploadProgress(0);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const ext = selectedFile.name.match(/\.[^/.]+$/)?.[0] ?? "";
        const titleTrimmed = projectTitle.trim();
        const finalName = titleTrimmed
            ? `${titleTrimmed}${ext}`
            : selectedFile.name;
        const fileToUpload = renameFile(selectedFile, finalName);

        setIsUploading(true);
        setUploadProgress(0);

        try {
            await uploadFileApi(
                fileToUpload,
                speakerId && speakerId !== "none" ? speakerId : null,
                autoTranslate,
                setUploadProgress,
            );

            setUploadDone(true);
            toast({
                title: "Upload successful!",
                description: autoTranslate
                    ? "File uploaded. Transcription and translation are starting."
                    : "Transcription is being processed. You will be redirected.",
            });

            // Navigate to dashboard after short delay so user sees success state
            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (error: unknown) {
            const msg =
                (error as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail ??
                "Failed to upload file. Please try again.";
            toast({
                title: "Upload failed",
                description: msg,
                variant: "destructive",
            });
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

    const canSubmit =
        !!selectedFile && !!projectTitle.trim() && !isUploading && !uploadDone;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Upload File
                        </h1>
                        <p className="text-muted-foreground">
                            Upload an audio or video file to start automatic
                            transcription.
                        </p>
                    </div>

                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-primary" />
                                Audio / Video File
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="project-title">
                                    Project Title{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="project-title"
                                    placeholder="e.g. Algorithms Lecture — Week 5"
                                    value={projectTitle}
                                    onChange={(e) =>
                                        setProjectTitle(e.target.value)
                                    }
                                    disabled={isUploading}
                                    maxLength={200}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This will be used as the file name shown on
                                    the dashboard.
                                </p>
                            </div>

                            {/* ── Drop Zone ── */}
                            <div className="space-y-2">
                                <Label>File</Label>
                                <div
                                    className={`
                    border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                    ${
                        isDragging
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }
                    ${selectedFile ? "border-green-500/50 bg-green-500/5" : ""}
                  `}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPTED_EXTENSIONS}
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelect(f);
                                        }}
                                    />

                                    {selectedFile ? (
                                        <div className="space-y-2">
                                            <FileAudio className="w-10 h-10 mx-auto text-green-600" />
                                            <p className="font-medium text-foreground">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatBytes(selectedFile.size)}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive mt-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                    setUploadProgress(0);
                                                    setUploadDone(false);
                                                }}
                                            >
                                                <X className="w-4 h-4 mr-1" />{" "}
                                                Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                                            <p className="font-medium text-foreground">
                                                Drag & drop file here
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                or click to browse
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Audio (MP3, WAV, M4A, OGG) max {MAX_AUDIO_SIZE_MB}MB <br />
                                                Video (MP4, MOV, AVI, MKV) max 2GB
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Speaker Dropdown ── */}
                            <div className="space-y-2">
                                <Label htmlFor="speaker">
                                    Speaker (optional)
                                </Label>
                                <Select
                                    value={speakerId}
                                    onValueChange={setSpeakerId}
                                >
                                    <SelectTrigger id="speaker">
                                        <SelectValue placeholder="Select a speaker..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No speaker
                                        </SelectItem>
                                        {speakers.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* Auto translate toggle */}
                            <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">Auto-Translate</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically queue English translation after transcription completes.
                                    </p>
                                </div>
                                <Switch
                                    checked={autoTranslate}
                                    onCheckedChange={setAutoTranslate}
                                    disabled={isUploading}
                                />
                            </div>

                            {/* ── Upload Progress ── */}
                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress
                                        value={uploadProgress}
                                        className="h-2"
                                    />
                                </div>
                            )}

                            {/* ── Success ── */}
                            {uploadDone && (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                        Upload complete! Redirecting to
                                        dashboard...
                                    </span>
                                </div>
                            )}

                            {/* ── Info hint ── */}
                            {!isUploading && !uploadDone && (
                                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        After upload, automatic transcription {autoTranslate && "and translation "} 
                                        will start. This may take a few minutes depending on the length of the media.
                                    </span>
                                </div>
                            )}

                            {/* ── Submit Button ── */}
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={!canSubmit}
                                onClick={handleUpload}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading {uploadProgress}%...
                                    </>
                                ) : uploadDone ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Upload Complete
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload & Start Transcription
                                    </>
                                )}
                            </Button>

                            {!projectTitle.trim() && selectedFile && (
                                <p className="text-xs text-center text-destructive">
                                    Please enter a project title before
                                    uploading.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default UploadPage;
