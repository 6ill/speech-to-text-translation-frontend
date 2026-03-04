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
    Loader2,
    AlertCircle,
    Edit3,
    RotateCcw,
    ArrowLeft,
    Mic,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getSegmentsApi,
    getFileUrlApi,
    submitTranslationCorrectionsApi,
} from "@/api/files";
import { Segment, CorrectionSubmit } from "@/types";

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TranslationSegmentRowProps {
    segment: Segment;
    isActive: boolean;
    localTranslation: string;
    isDirty: boolean;
    onSeek: (time: number) => void;
    onChange: (id: string, text: string) => void;
    onReset: (id: string) => void;
}

function TranslationSegmentRow({
    segment,
    isActive,
    localTranslation,
    isDirty,
    onSeek,
    onChange,
    onReset,
}: TranslationSegmentRowProps) {
    return (
        <div
            className={`
        rounded-lg border p-3 transition-colors space-y-3
        ${
            isActive
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:border-border/80"
        }
      `}
        >
            {/* Timestamp range */}
            <button
                className="text-xs font-mono text-primary hover:underline"
                onClick={() => onSeek(segment.start_timestamp)}
            >
                {formatTime(segment.start_timestamp)}
                <span className="text-muted-foreground"> – </span>
                {formatTime(segment.end_timestamp)}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Source: Indonesian (read-only) */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Indonesian
                    </p>
                    <div className="text-sm leading-relaxed text-foreground bg-muted/40 rounded-md p-2 min-h-[60px]">
                        {segment.transcription_text}
                    </div>
                </div>

                {/* Target: English (editable) */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        English
                    </p>
                    <Textarea
                        value={localTranslation}
                        onChange={(e) => onChange(segment.id, e.target.value)}
                        placeholder="Translation..."
                        className={`
              text-sm resize-none min-h-[60px]
              ${isDirty ? "border-amber-400 focus-visible:ring-amber-400" : ""}
            `}
                        rows={Math.max(
                            2,
                            Math.ceil(localTranslation.length / 60),
                        )}
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
        </div>
    );
}


const TranslationEditor = () => {
    const { id: fileId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

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
        staleTime: 1000 * 60 * 50,
    });

    const segments: Segment[] = data?.data?.segments ?? [];
    const audioUrl = urlData?.data?.download_url ?? "";
    const hasTranslation = segments.some((s) => s.translation_text !== null);

    useEffect(() => {
        if (segments.length > 0) {
            setLocalEdits((prev) => {
                const init: Record<string, string> = {};
                segments.forEach((s) => {
                    init[s.id] = prev[s.id] ?? s.translation_text ?? "";
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
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
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
            segments.find((s) => s.id === segmentId)?.translation_text ?? "";
        setLocalEdits((prev) => ({ ...prev, [segmentId]: original }));
    };

    const dirtySegments = segments.filter(
        (s) =>
            localEdits[s.id] !== undefined &&
            localEdits[s.id] !== (s.translation_text ?? ""),
    );

    const { mutate: submitCorrections, isPending: isSaving } = useMutation({
        mutationFn: (corrections: CorrectionSubmit[]) =>
            submitTranslationCorrectionsApi(corrections),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["segments", fileId] });
            toast({
                title: "Translation corrections saved",
                description: `${dirtySegments.length} segment(s) updated.`,
            });
        },
        onError: () => {
            toast({
                title: "Failed to save",
                description: "Please try again.",
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


    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading translation...</span>
                </div>
            </div>
        );
    }

    if (isError || !hasTranslation) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                    <AlertCircle className="w-8 h-8" />
                    <p>
                        {isError
                            ? "An error occurred while loading data."
                            : "Translation is not yet available for this file."}
                    </p>
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

            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <main className="container mx-auto px-4 py-6">
                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {/* Back to Dashboard */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Dashboard
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Translation Editor
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {segments.length} segments · Indonesian →
                                English
                            </p>
                        </div>
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
                        {/* Go to Transcription */}
                        <Button
                            variant="outline"
                            onClick={() =>
                                navigate(`/file/${fileId}/transcribe`)
                            }
                        >
                            <Mic className="w-4 h-4 mr-2" />
                            Go to Transcription
                        </Button>
                        <Button
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
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>

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
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Translation Segments ── */}
                    <div className="lg:col-span-3">
                        <Card className="border-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Translation Segments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                    {segments.map((segment) => (
                                        <TranslationSegmentRow
                                            key={segment.id}
                                            segment={segment}
                                            isActive={
                                                segment.id === activeSegmentId
                                            }
                                            localTranslation={
                                                localEdits[segment.id] ??
                                                segment.translation_text ??
                                                ""
                                            }
                                            isDirty={
                                                localEdits[segment.id] !==
                                                    undefined &&
                                                localEdits[segment.id] !==
                                                    (segment.translation_text ??
                                                        "")
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

export default TranslationEditor;
