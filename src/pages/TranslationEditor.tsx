import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Play,
    Pause,
    RotateCw,
    Volume2,
    Save,
    Loader2,
    AlertCircle,
    Edit3,
    RotateCcw,
    ArrowLeft,
    Mic,
    Download,
    ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getSegmentsApi,
    getFileUrlApi,
    submitTranslationCorrectionsApi,
    exportSubtitlesApi,
    ExportType,
    SubtitleFormat,
} from "@/api/files";
import { Segment, CorrectionSubmit } from "@/types";

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TranslationSegmentRowProps {
    segment: Segment;
    localTranslation: string;
    isDirty: boolean;
    onSeek: (time: number) => void;
    onChange: (id: string, text: string) => void;
    onReset: (id: string) => void;
    nodeRef: (node: HTMLDivElement | null) => void;
}

const TranslationSegmentRow = ({
    segment,
    localTranslation,
    isDirty,
    onSeek,
    onChange,
    onReset,
    nodeRef,
}: TranslationSegmentRowProps) => (
    <div
        ref={nodeRef}
        data-segment-id={segment.id}
        className="rounded-lg border border-border p-3 transition-colors space-y-3"
    >
        <button
            className="text-xs font-mono text-primary hover:underline"
            onClick={() => onSeek(segment.start_timestamp)}
        >
            {formatTime(segment.start_timestamp)}
            <span className="text-muted-foreground"> – </span>
            {formatTime(segment.end_timestamp)}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Indonesian
                </p>
                <div className="text-sm leading-relaxed text-foreground bg-muted/40 rounded-md p-2 min-h-[60px]">
                    {segment.transcription_text}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    English
                </p>
                <Textarea
                    value={localTranslation}
                    onChange={(e) => onChange(segment.id, e.target.value)}
                    placeholder="Translation..."
                    className={`text-sm resize-none min-h-[60px] ${
                        isDirty
                            ? "border-amber-400 focus-visible:ring-amber-400"
                            : ""
                    }`}
                    rows={Math.max(2, Math.ceil(localTranslation.length / 60))}
                />
                {isDirty && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Edited
                        </span>
                        <button
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            onClick={() => onReset(segment.id)}
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const TranslationEditor = () => {
    const { id: fileId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const audioRef = useRef<HTMLAudioElement>(null);
    const currentTimeRef = useRef(0);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const durationLabelRef = useRef<HTMLSpanElement>(null);

    // Map of segmentId → DOM row node for direct classList highlight
    const rowNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const activeIdRef = useRef<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [localEdits, setLocalEdits] = useState<Record<string, string>>({});
    const [isExporting, setIsExporting] = useState(false);

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
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;
        audio.src = audioUrl;
        audio.load();
    }, [audioUrl]);

    useEffect(() => {
        if (segments.length === 0) return;
        setLocalEdits((prev) => {
            const init: Record<string, string> = {};
            segments.forEach((s) => {
                init[s.id] = prev[s.id] ?? s.translation_text ?? "";
            });
            return init;
        });
    }, [segments.length]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            const time = audio.currentTime;
            const dur = audio.duration || 0;
            currentTimeRef.current = time;

            if (progressBarRef.current && dur > 0) {
                progressBarRef.current.style.width = `${(time / dur) * 100}%`;
            }
            if (currentTimeLabelRef.current) {
                currentTimeLabelRef.current.textContent = formatTime(time);
            }

            const active = segments.find(
                (s) => time >= s.start_timestamp && time < s.end_timestamp,
            );
            const newId = active?.id ?? null;

            if (newId !== activeIdRef.current) {
                if (activeIdRef.current) {
                    const prev = rowNodesRef.current.get(activeIdRef.current);
                    if (prev) {
                        prev.classList.remove(
                            "border-primary/40",
                            "bg-primary/5",
                        );
                        prev.classList.add("border-border");
                    }
                }
                if (newId) {
                    const next = rowNodesRef.current.get(newId);
                    if (next) {
                        next.classList.remove("border-border");
                        next.classList.add("border-primary/40", "bg-primary/5");
                        next.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                        });
                    }
                }
                activeIdRef.current = newId;
            }
        };

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            if (durationLabelRef.current) {
                durationLabelRef.current.textContent = formatTime(
                    audio.duration,
                );
            }
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("play", onPlay);
            audio.removeEventListener("pause", onPause);
            audio.removeEventListener("ended", onEnded);
        };
    }, [segments]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.paused ? audio.play() : audio.pause();
    }, []);

    const seek = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        currentTimeRef.current = time;
        if (currentTimeLabelRef.current) {
            currentTimeLabelRef.current.textContent = formatTime(time);
        }
        if (progressBarRef.current && audio.duration > 0) {
            progressBarRef.current.style.width = `${(time / audio.duration) * 100}%`;
        }
    }, []);

    const changeRate = (rate: number) => {
        setPlaybackRate(rate);
        if (audioRef.current) audioRef.current.playbackRate = rate;
    };

    const handleChange = (id: string, text: string) =>
        setLocalEdits((prev) => ({ ...prev, [id]: text }));

    const handleReset = (id: string) => {
        const original =
            segments.find((s) => s.id === id)?.translation_text ?? "";
        setLocalEdits((prev) => ({ ...prev, [id]: original }));
    };

    const dirtySegments = segments.filter(
        (s) =>
            localEdits[s.id] !== undefined &&
            localEdits[s.id] !== (s.translation_text ?? ""),
    );

    const handleExport = async (exportType: ExportType, format: SubtitleFormat) => {
        setIsExporting(true);
        try {
            await exportSubtitlesApi(fileId!, exportType, format);
        } catch {
            toast({
                title: "Export failed",
                description: "Could not download subtitle file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const { mutate: submitCorrections, isPending: isSaving } = useMutation({
        mutationFn: (c: CorrectionSubmit[]) =>
            submitTranslationCorrectionsApi(c),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["segments", fileId] });
            toast({
                title: "Translation corrections saved",
                description: `${dirtySegments.length} segment(s) updated.`,
            });
        },
        onError: () =>
            toast({
                title: "Failed to save",
                description: "Please try again.",
                variant: "destructive",
            }),
    });

    const handleSave = () => {
        if (!dirtySegments.length) return;
        submitCorrections(
            dirtySegments.map((s) => ({
                segment_id: s.id,
                corrected_text: localEdits[s.id],
            })),
        );
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
                            ? "An error occurred."
                            : "Translation not yet available for this file."}
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
            <audio ref={audioRef} preload="metadata" />

            <main className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
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

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={isExporting}>
                                    {isExporting
                                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        : <Download className="w-4 h-4 mr-2" />}
                                    Export Subtitles
                                    <ChevronDown className="w-3 h-3 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Transcription (Indonesian)</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExport("transcription", "srt")}>
                                    Download as .srt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport("transcription", "vtt")}>
                                    Download as .vtt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Translation (English)</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExport("translation", "srt")}>
                                    Download as .srt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport("translation", "vtt")}>
                                    Download as .vtt
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            onClick={() =>
                                navigate(`/file/${fileId}/transcribe`)
                            }
                        >
                            <Mic className="w-4 h-4 mr-2" /> Go to Transcription
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!dirtySegments.length || isSaving}
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
                                    <Volume2 className="w-4 h-4 text-primary" />{" "}
                                    Audio Player
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className="w-full h-3 bg-secondary rounded-full cursor-pointer relative overflow-hidden"
                                    onClick={(e) => {
                                        const rect =
                                            e.currentTarget.getBoundingClientRect();
                                        seek(
                                            ((e.clientX - rect.left) /
                                                rect.width) *
                                                duration,
                                        );
                                    }}
                                >
                                    <div
                                        ref={progressBarRef}
                                        className="bg-primary h-full rounded-full absolute top-0 left-0"
                                        style={{
                                            width: "0%",
                                            transition: "none",
                                        }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span ref={currentTimeLabelRef}>0:00</span>
                                    <span ref={durationLabelRef}>0:00</span>
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            seek(
                                                Math.max(
                                                    0,
                                                    currentTimeRef.current - 5,
                                                ),
                                            )
                                        }
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="w-10 h-10 rounded-full p-0"
                                        onClick={togglePlay}
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
                                                    currentTimeRef.current + 5,
                                                ),
                                            )
                                        }
                                    >
                                        <RotateCw className="w-4 h-4" />
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
                                            nodeRef={(node) => {
                                                if (node)
                                                    rowNodesRef.current.set(
                                                        segment.id,
                                                        node,
                                                    );
                                                else
                                                    rowNodesRef.current.delete(
                                                        segment.id,
                                                    );
                                            }}
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
