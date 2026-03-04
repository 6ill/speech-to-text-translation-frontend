import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Save,
    Languages,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Edit3,
    RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getSegmentsApi,
    getFileUrlApi,
    submitTranscriptionCorrectionsApi,
    triggerTranslationApi,
} from "@/api/files";
import { Segment, CorrectionSubmit } from "@/types";

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

interface SegmentRowProps {
    segment: Segment;
    isActive: boolean;
    localText: string;
    isDirty: boolean;
    onSeek: (time: number) => void;
    onChange: (id: string, text: string) => void;
    onReset: (id: string) => void;
}

function SegmentRow({
    segment,
    isActive,
    localText,
    isDirty,
    onSeek,
    onChange,
    onReset,
}: SegmentRowProps) {
    return (
        <div
            className={`
        group flex gap-3 p-3 rounded-lg border transition-colors
        ${
            isActive
                ? "border-primary/40 bg-primary/5"
                : "border-transparent hover:border-border hover:bg-muted/30"
        }
      `}
        >
            {/* Timestamp — click to seek */}
            <button
                className="shrink-0 text-xs font-mono text-primary hover:underline mt-1 w-10 text-left"
                onClick={() => onSeek(segment.start_timestamp)}
                title="Seek to this segment"
            >
                {formatTime(segment.start_timestamp)}
            </button>

            {/* Editable text */}
            <div className="flex-1 space-y-1">
                <Textarea
                    value={localText}
                    onChange={(e) => onChange(segment.id, e.target.value)}
                    className={`
                        min-h-0 resize-none text-sm leading-relaxed py-1 px-2
                        ${isDirty ? "border-amber-400 focus-visible:ring-amber-400" : ""}
                    `}
                    rows={Math.max(2, Math.ceil(localText.length / 80))}
                />
                {isDirty && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            Edited
                        </span>
                        <button
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            onClick={() => onReset(segment.id)}
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const TranscriptionEditor = () => {
    const { id: fileId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    //  Local edits map: segmentId → text ──
    const [localEdits, setLocalEdits] = useState<Record<string, string>>({});

    const { data, isLoading, isError } = useQuery({
        queryKey: ["segments", fileId],
        queryFn: () => getSegmentsApi(fileId!),
        enabled: !!fileId,
    });

    const { data: urlData } = useQuery({
        queryKey: ["fileUrl", fileId],
        queryFn: () => getFileUrlApi(fileId!),
        enabled: !!fileId,
        staleTime: 1000 * 60 * 50, // 50 min — URL valid 1 hour
    });

    const segments: Segment[] = data?.data?.segments ?? [];
    const audioUrl = urlData?.data?.download_url ?? "";

    // ── Init local edits when segments load ──
    useEffect(() => {
        if (segments.length > 0) {
            setLocalEdits((prev) => {
                const init: Record<string, string> = {};
                segments.forEach((s) => {
                    // Preserve existing edits if already set
                    init[s.id] = prev[s.id] ?? s.transcription_text;
                });
                return init;
            });
        }
    }, [segments.length]);

    const activeSegmentId = segments.find(
        (s) =>
            currentTime >= s.start_timestamp && currentTime < s.end_timestamp,
    )?.id;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTime = () => setCurrentTime(audio.currentTime);
        const onLoaded = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const seek = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
    }, []);

    const changeRate = (rate: number) => {
        setPlaybackRate(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
    };

    const handleChange = (segmentId: string, text: string) => {
        setLocalEdits((prev) => ({ ...prev, [segmentId]: text }));
    };

    const handleReset = (segmentId: string) => {
        const original =
            segments.find((s) => s.id === segmentId)?.transcription_text ?? "";
        setLocalEdits((prev) => ({ ...prev, [segmentId]: original }));
    };

    const dirtySegments = segments.filter(
        (s) =>
            localEdits[s.id] !== undefined &&
            localEdits[s.id] !== s.transcription_text,
    );

    const { mutate: submitCorrections, isPending: isSaving } = useMutation({
        mutationFn: (corrections: CorrectionSubmit[]) =>
            submitTranscriptionCorrectionsApi(corrections),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["segments", fileId] });
            toast({
                title: "Corrections saved!",
                description: `Modified ${dirtySegments.length} segment.`,
            });
        },
        onError: () => {
            toast({
                title: "Failed to save corrections",
                description: "Try again.",
                variant: "destructive",
            });
        },
    });

    const handleSave = () => {
        if (dirtySegments.length === 0) return;
        const corrections: CorrectionSubmit[] = dirtySegments.map((s) => ({
            segment_id: s.id,
            corrected_text: localEdits[s.id],
        }));
        submitCorrections(corrections);
    };

    const { mutate: triggerTranslation, isPending: isTriggering } = useMutation(
        {
            mutationFn: () => triggerTranslationApi(fileId!),
            onSuccess: () => {
                toast({
                    title: "Start translating!",
                    description:
                        "Process is running in the background. Check the dashboard for status.",
                });
                navigate("/");
            },
            onError: () => {
                toast({
                    title: "Failed to start translating",
                    variant: "destructive",
                });
            },
        },
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Load transcription...</span>
                </div>
            </div>
        );
    }

    if (isError || segments.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                    <AlertCircle className="w-8 h-8" />
                    <p>Transcription is not yet available or an error occurred.</p>
                    <Button variant="outline" onClick={() => navigate("/")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hidden audio element */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <main className="container mx-auto px-4 py-6">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Transcription Editor
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {segments.length} segments
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {dirtySegments.length > 0 && (
                            <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-400"
                            >
                                {dirtySegments.length} unsaved
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleSave}
                            disabled={dirtySegments.length === 0 || isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </Button>
                        <Button
                            onClick={() => triggerTranslation()}
                            disabled={isTriggering || dirtySegments.length > 0}
                            title={
                                dirtySegments.length > 0
                                    ? "Simpan dulu sebelum lanjut ke terjemahan"
                                    : ""
                            }
                        >
                            {isTriggering ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Languages className="w-4 h-4 mr-2" />
                            )}
                            Proceed to Translation
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Audio Player ── */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4 border-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Volume2 className="w-4 h-4 text-primary" />
                                    Audio Player
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Progress bar */}
                                <div
                                    className="w-full h-2 bg-secondary rounded-full cursor-pointer"
                                    onClick={(e) => {
                                        const rect =
                                            e.currentTarget.getBoundingClientRect();
                                        const ratio =
                                            (e.clientX - rect.left) /
                                            rect.width;
                                        seek(ratio * duration);
                                    }}
                                >
                                    <div
                                        className="bg-primary h-2 rounded-full transition-none"
                                        style={{
                                            width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                                        }}
                                    />
                                </div>

                                {/* Time */}
                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            seek(Math.max(0, currentTime - 5))
                                        }
                                    >
                                        <SkipBack className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={togglePlay}
                                        size="sm"
                                        className="w-10 h-10 rounded-full p-0"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-4 h-4" />
                                        ) : (
                                            <Play className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            seek(
                                                Math.min(
                                                    duration,
                                                    currentTime + 5,
                                                ),
                                            )
                                        }
                                    >
                                        <SkipForward className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Playback speed */}
                                <div>
                                    <p className="text-xs text-muted-foreground text-center mb-2">
                                        Playback Speed
                                    </p>
                                    <div className="flex justify-center gap-1">
                                        {[0.75, 1, 1.25, 1.5].map((rate) => (
                                            <Button
                                                key={rate}
                                                variant={
                                                    playbackRate === rate
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                className="text-xs px-2 h-7"
                                                onClick={() => changeRate(rate)}
                                            >
                                                {rate}x
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Save reminder */}
                                {dirtySegments.length > 0 && (
                                    <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg p-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            Save changes before proceeding to translation.
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Segment Editor ── */}
                    <div className="lg:col-span-2">
                        <Card className="border-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Transcription
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                                    {segments.map((segment) => (
                                        <SegmentRow
                                            key={segment.id}
                                            segment={segment}
                                            isActive={
                                                segment.id === activeSegmentId
                                            }
                                            localText={
                                                localEdits[segment.id] ??
                                                segment.transcription_text
                                            }
                                            isDirty={
                                                localEdits[segment.id] !==
                                                    undefined &&
                                                localEdits[segment.id] !==
                                                    segment.transcription_text
                                            }
                                            onSeek={seek}
                                            onChange={handleChange}
                                            onReset={handleReset}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TranscriptionEditor;
