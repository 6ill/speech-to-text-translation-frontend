import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.ogg,.mp4,.webm";
const MAX_SIZE_MB = 500;

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


const UploadPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [speakerId, setSpeakerId] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);

    // Fetch speaker list for dropdown
    const { data: peopleData } = useQuery({
        queryKey: ["people"],
        queryFn: getPeopleApi,
    });
    const speakers = peopleData?.data ?? [];

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_TYPES.includes(file.type) && file.type !== "") {
            return "Unsupported file format. Please use MP3, WAV, M4A, OGG, or MP4.";
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return `File size too large. Maximum ${MAX_SIZE_MB} MB.`;
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

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const res = await uploadFileApi(
                selectedFile,
                speakerId || null,
                setUploadProgress,
            );

            setUploadDone(true);
            toast({
                title: "Upload berhasil!",
                description:
                    "Transcription is being processed. You will be redirected to the dashboard.",
            });

            // Navigate to dashboard after short delay so user sees success state
            setTimeout(() => {
                navigate("/");
            }, 1500);

            void res;
        } catch (error: unknown) {
            const msg =
                (error as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail ??
                "Failed to upload file. Please try again.";
            toast({
                title: "Upload gagal",
                description: msg,
                variant: "destructive",
            });
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };


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
                           Upload your recording to start transcription automatically
                        </p>
                    </div>

                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-primary" />
                                File Audio / Video
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                onClick={() => fileInputRef.current?.click()}
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
                                            <X className="w-4 h-4 mr-1" />
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
                                            or click here to browse files
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            MP3, WAV, M4A, OGG, MP4 — max{" "}
                                            {MAX_SIZE_MB} MB
                                        </p>
                                    </div>
                                )}
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
                                        <SelectValue placeholder="Choose speaker..." />
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

                            {/* ── Success state ── */}
                            {uploadDone && (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                        Successfully uploaded! Redirect to
                                        dashboard...
                                    </span>
                                </div>
                            )}

                            {/* ── Error hint ── */}
                            {!isUploading &&
                                !uploadDone &&
                                selectedFile === null && (
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>
                                            After uploading, automatic transcription will begin. This process may take a few minutes depending on the audio length.
                                        </span>
                                    </div>
                                )}

                            {/* ── Submit Button ── */}
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={
                                    !selectedFile || isUploading || uploadDone
                                }
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
                                        Upload is completed
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload & start transcribing
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default UploadPage;
