import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Play,
    Pause,
    RotateCw,
    Volume2,
    Save,
    Languages,
    Loader2,
    AlertCircle,
    Edit3,
    RotateCcw,
    ArrowLeft,
    ArrowRight,
    Download,
    ChevronDown,
    Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getSegmentsApi,
    getFileUrlApi,
    getFileByIdApi,
    submitTranscriptionCorrectionsApi,
    triggerTranslationApi,
    exportSubtitlesApi,
    ExportType,
    SubtitleFormat,
    getFullTextApi,
} from "@/api/files";
import { Segment, CorrectionSubmit } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Segment Row ──────────────────────────────────────────────────────────────
// Simple presentational component — highlight is applied via direct DOM
// classList manipulation from the parent's timeupdate handler, NOT via props.

interface SegmentRowProps {
    segment: Segment;
    localText: string;
    isDirty: boolean;
    onSeek: (time: number) => void;
    onChange: (id: string, text: string) => void;
    onReset: (id: string) => void;
    // ref callback so parent can store the DOM node
    nodeRef: (node: HTMLDivElement | null) => void;
}

const SegmentRow = ({
    segment,
    localText,
    isDirty,
    onSeek,
    onChange,
    onReset,
    nodeRef,
}: SegmentRowProps) => (
    <div
        ref={nodeRef}
        data-segment-id={segment.id}
        className="flex gap-3 p-3 rounded-lg border border-transparent
               transition-colors hover:border-border hover:bg-muted/30"
    >
        <button
            className="shrink-0 text-xs font-mono text-primary hover:underline mt-1 text-left w-24"
            onClick={() => onSeek(segment.start_timestamp)}
        >
            {formatTime(segment.start_timestamp)}
            <span className="text-muted-foreground"> – </span>
            {formatTime(segment.end_timestamp)}
        </button>

        <div className="flex-1 space-y-1">
            <Textarea
                value={localText}
                onChange={(e) => onChange(segment.id, e.target.value)}
                className={`min-h-0 resize-none text-sm leading-relaxed py-1 px-2 ${
                    isDirty
                        ? "border-amber-400 focus-visible:ring-amber-400"
                        : ""
                }`}
                rows={Math.max(2, Math.ceil(localText.length / 80))}
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
);

// ─── Transcription Editor ─────────────────────────────────────────────────────

const TranscriptionEditor = () => {
    const { id: fileId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // ── Audio ──
    const audioRef = useRef<HTMLAudioElement>(null);

    // KEY FIX: currentTime lives in a ref, NOT state.
    // This means timeupdate does NOT trigger React re-renders.
    const currentTimeRef = useRef(0);

    // Refs to DOM nodes we update directly in timeupdate (no re-render needed)
    const progressBarRef = useRef<HTMLDivElement>(null);
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const durationLabelRef = useRef<HTMLSpanElement>(null);

    // Map of segmentId → DOM div for direct classList manipulation
    const rowNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
    // Track which segment is currently highlighted
    const activeIdRef = useRef<string | null>(null);

    // Only these need to be React state (they drive structural UI changes)
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [localEdits, setLocalEdits] = useState<Record<string, string>>({});
    const [isExporting, setIsExporting] = useState(false);

    // ── Queries ──
    const { data: fileData } = useQuery({
        queryKey: ["file", fileId],
        queryFn: () => getFileByIdApi(fileId!),
        enabled: !!fileId,
    });
    const isAlreadyTranslated = fileData?.data?.status === "translated";

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

    // Full-text tab state & query 
    const [activeTab, setActiveTab] = useState("timestamp");

    const { data: fullTextData, isFetching: isFullTextLoading } = useQuery({
        queryKey: ["fullText", fileId, "transcription"],
        queryFn: () => getFullTextApi(fileId!, "transcription"),
        enabled: !!fileId && activeTab === "full-text",
        staleTime: 1000 * 60 * 5,
    });

    const audioUrl = urlData?.data?.download_url ?? "";

    // ── Set audio src imperatively when presigned URL arrives ──
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;
        audio.src = audioUrl;
        audio.load();
    }, [audioUrl]);

    // ── Init local edits ──
    useEffect(() => {
        if (segments.length === 0) return;
        setLocalEdits((prev) => {
            const init: Record<string, string> = {};
            segments.forEach((s) => {
                init[s.id] = prev[s.id] ?? s.transcription_text;
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

            // Highlight active segment via classList — no setState
            const activeSegment = segments.find(
                (s) => time >= s.start_timestamp && time < s.end_timestamp,
            );
            const newId = activeSegment?.id ?? null;

            if (newId !== activeIdRef.current) {
                // Remove old highlight
                if (activeIdRef.current) {
                    const prevEl = rowNodesRef.current.get(activeIdRef.current);
                    if (prevEl) {
                        prevEl.classList.remove(
                            "border-primary/40",
                            "bg-primary/5",
                        );
                        prevEl.classList.add("border-transparent");
                    }
                }
                // Add new highlight + scroll into view
                if (newId) {
                    const nextEl = rowNodesRef.current.get(newId);
                    if (nextEl) {
                        nextEl.classList.remove("border-transparent");
                        nextEl.classList.add(
                            "border-primary/40",
                            "bg-primary/5",
                        );
                        nextEl.scrollIntoView({
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
    }, [segments]); // re-subscribe when segments list changes

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
        // Immediately update UI without waiting for next timeupdate
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

    const handleChange = (id: string, text: string) => {
        setLocalEdits((prev) => ({ ...prev, [id]: text }));
    }

    const handleReset = (id: string) => {
        const original =
            segments.find((s) => s.id === id)?.transcription_text ?? "";
        setLocalEdits((prev) => ({ ...prev, [id]: original }));
    };

    const dirtySegments = segments.filter(
        (s) =>
            localEdits[s.id] !== undefined &&
            localEdits[s.id] !== s.transcription_text,
    );

    const handleExport = async (
        exportType: ExportType,
        format: SubtitleFormat,
    ) => {
        setIsExporting(true);
        try {
            await exportSubtitlesApi(fileId!, exportType, format);
        } catch {
            toast({
                title: "Export failed",
                description:
                    "Could not download subtitle file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const { mutate: submitCorrections, isPending: isSaving } = useMutation({
        mutationFn: (c: CorrectionSubmit[]) =>
            submitTranscriptionCorrectionsApi(c),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["segments", fileId] });
            toast({
                title: "Changes saved",
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

    const { mutate: triggerTranslation, isPending: isTriggering } = useMutation(
        {
            mutationFn: () => triggerTranslationApi(fileId!),
            onSuccess: () => {
                toast({
                    title: "Translation started!",
                    description: "Check the dashboard for status.",
                });
                navigate("/");
            },
            onError: () =>
                toast({
                    title: "Failed to start translation",
                    variant: "destructive",
                }),
        },
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading transcription...</span>
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
                    <p>Transcription not available or an error occurred.</p>
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
            {/* No src prop — set imperatively via useEffect when URL is ready */}
            <audio ref={audioRef} preload="metadata" />

            <main className="container mx-auto px-4 py-6">
                {/* Page header */}
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
                                Transcription Editor
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {segments.length} segments
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
                                <Button
                                    variant="outline"
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    Export Subtitles
                                    <ChevronDown className="w-3 h-3 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    Transcription
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        handleExport("transcription", "srt")
                                    }
                                >
                                    Download as .srt
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        handleExport("transcription", "vtt")
                                    }
                                >
                                    Download as .vtt
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
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
                        {isAlreadyTranslated ? (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    navigate(`/file/${fileId}/translate`)
                                }
                            >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Go to Translation
                            </Button>
                        ) : (
                            <Button
                                onClick={() => triggerTranslation()}
                                disabled={
                                    isTriggering || dirtySegments.length > 0
                                }
                                title={
                                    dirtySegments.length > 0
                                        ? "Save changes before proceeding to translation"
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
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                {/* Progress bar */}
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
                                        className="bg-primary h-full rounded-full absolute top-0 left-0"
                                        ref={progressBarRef}
                                        style={{
                                            width: "0%",
                                            transition: "none",
                                        }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    {/* Updated directly via ref — no React re-render */}
                                    <span ref={currentTimeLabelRef}>0:00</span>
                                    <span ref={durationLabelRef}>0:00</span>
                                </div>

                                {/* Controls */}
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

                                {dirtySegments.length > 0 && (
                                    <div
                                        className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30
                                  text-amber-700 dark:text-amber-400 rounded-lg p-2"
                                    >
                                        <Save className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            Save changes before proceeding to
                                            translation.
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Segment list ── */}
                    <div className="lg:col-span-2">
                        <Card className="border-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Transcription
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="timestamp">Timestamp View</TabsTrigger>
                                        <TabsTrigger value="full-text">Full Text View</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="timestamp">
                                        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                                            {segments.map((segment) => (
                                                <SegmentRow
                                                    key={segment.id}
                                                    segment={segment}
                                                    localText={localEdits[segment.id] ?? segment.transcription_text}
                                                    isDirty={
                                                        localEdits[segment.id] !== undefined &&
                                                        localEdits[segment.id] !== segment.transcription_text
                                                    }
                                                    onSeek={seek}
                                                    onChange={handleChange}
                                                    onReset={handleReset}
                                                    nodeRef={(node) => {
                                                        if (node) rowNodesRef.current.set(segment.id, node);
                                                        else rowNodesRef.current.delete(segment.id);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="full-text">
                                        {isFullTextLoading ? (
                                            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Loading full text...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-end mb-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigator.clipboard.writeText(fullTextData?.data?.full_text ?? "")}
                                                    >
                                                        <Copy className="w-3.5 h-3.5 mr-2" />
                                                        Copy
                                                    </Button>
                                                </div>
                                                <div className="min-h-[400px] max-h-[70vh] overflow-y-auto p-4 bg-secondary rounded-lg">
                                                    <p className="text-base leading-relaxed text-foreground">
                                                        {fullTextData?.data?.full_text ?? ""}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TranscriptionEditor;
