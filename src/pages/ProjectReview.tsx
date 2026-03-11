import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Play, Pause, RotateCcw, RotateCw, Volume2,
    ArrowLeft, Loader2, AlertCircle, Check, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFileByIdApi, getFileUrlApi } from "@/api/files";
import {
    getCorrectionsApi, reviewCorrectionsApi, TaskType, ReviewAction,
} from "@/api/corrections";
import { CorrectionRecord } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_BADGE: Record<string, string> = {
    pending:  "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-600 border-green-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

// ─── Correction Row ───────────────────────────────────────────────────────────

interface CorrectionRowProps {
    correction: CorrectionRecord;
    selected: boolean;
    onToggle: (id: string) => void;
    onReview: (ids: string[], action: ReviewAction) => void;
    isReviewing: boolean;
    onSeek: (time: number) => void;
    nodeRef: (node: HTMLDivElement | null) => void;
}

function CorrectionRow({
    correction, selected, onToggle, onReview, isReviewing, onSeek, nodeRef,
}: CorrectionRowProps) {
    return (
        <div
            ref={nodeRef}
            data-correction-id={correction.id}
            className="flex gap-3 p-4 rounded-lg border border-transparent
                       transition-colors hover:border-border hover:bg-muted/30"
        >
            <Checkbox
                checked={selected}
                onCheckedChange={() => onToggle(correction.id)}
                className="mt-1 shrink-0"
                disabled={correction.status !== "pending"}
            />

            <div className="flex-1 min-w-0 space-y-3">
                {/* Timestamp + status */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        className="text-xs font-mono text-primary hover:underline shrink-0"
                        onClick={() => onSeek(correction.start_timestamp)}
                    >
                        {formatTime(correction.start_timestamp)}
                        <span className="text-muted-foreground"> – </span>
                        {formatTime(correction.end_timestamp)}
                    </button>
                    <Badge
                        variant="outline"
                        className={`text-xs capitalize ${STATUS_BADGE[correction.status]}`}
                    >
                        {correction.status}
                    </Badge>
                </div>

                {/* Original → Corrected */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Original
                        </p>
                        <p className="leading-relaxed text-muted-foreground line-through decoration-muted-foreground/50">
                            {correction.original_text}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Correction
                        </p>
                        <p className="leading-relaxed text-foreground font-medium">
                            {correction.corrected_text}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                {correction.status === "pending" ? (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive h-7 px-2 text-xs"
                            disabled={isReviewing}
                            onClick={() => onReview([correction.id], "reject")}
                        >
                            <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                            disabled={isReviewing}
                            onClick={() => onReview([correction.id], "approve")}
                        >
                            <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        disabled={isReviewing}
                        onClick={() => onReview([correction.id], "reset")}
                    >
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset to pending
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Correction Tab ───────────────────────────────────────────────────────────
// Each tab instance has its own rowNodesRef. It reports its current node map
// + corrections list up to the parent via onRegisterNodes so the shared audio
// timeupdate handler can look up nodes by correction.id for the active tab only.

interface CorrectionTabProps {
    taskType: TaskType;
    fileId: string;
    seek: (time: number) => void;
    onRegisterNodes: (
        taskType: TaskType,
        nodes: Map<string, HTMLDivElement>,
        corrections: CorrectionRecord[],
    ) => void;
}

function CorrectionTab({ taskType, fileId, seek, onRegisterNodes }: CorrectionTabProps) {
    const queryClient = useQueryClient();
    const { toast }   = useToast();

    const [selected, setSelected]         = useState<string[]>([]);
    const [filterStatus, setFilterStatus] =
        useState<"pending" | "approved" | "rejected" | undefined>(undefined);

    // This tab owns its own DOM-node map
    const rowNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

    // Always fetch ALL corrections — no status filter sent to the server.
    // Client-side filtering keeps count badges accurate regardless of active pill.
    const { data, isLoading, isError } = useQuery({
        queryKey: ["corrections", taskType, fileId],
        queryFn: () => getCorrectionsApi(taskType, fileId),
        enabled: !!fileId,
    });

    const allCorrections: CorrectionRecord[] = data?.data ?? [];

    // What's actually rendered — filtered by the active pill
    const corrections = filterStatus
        ? allCorrections.filter((c) => c.status === filterStatus)
        : allCorrections;

    // pending always from the full list for select-all and bulk actions
    const pending = allCorrections.filter((c) => c.status === "pending");

    // Inform the parent every time the full list changes so timeupdate
    // handler can match playback time against correction timestamps.
    useEffect(() => {
        onRegisterNodes(taskType, rowNodesRef.current, allCorrections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allCorrections.length, taskType]);

    const { mutate: doReview, isPending: isReviewing } = useMutation({
        mutationFn: ({ ids, action }: { ids: string[]; action: ReviewAction }) =>
            reviewCorrectionsApi(taskType, ids, action),
        onSuccess: (res) => {
            toast({ title: res.message });
            setSelected([]);
            queryClient.invalidateQueries({ queryKey: ["corrections", taskType, fileId] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        },
        onError: () => toast({ title: "Review failed", variant: "destructive" }),
    });

    const handleToggle = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const allPendingSelected =
        pending.length > 0 && pending.every((c) => selected.includes(c.id));

    const handleSelectAll = () =>
        setSelected(allPendingSelected ? [] : pending.map((c) => c.id));

    if (isLoading)
        return (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading corrections...</span>
            </div>
        );

    if (isError)
        return (
            <div className="flex items-center justify-center py-12 gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Failed to load corrections.</span>
            </div>
        );

    return (
        <div className="space-y-3">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Filter pills */}
                <div className="flex gap-1.5 flex-wrap">
                    {([undefined, "pending", "approved", "rejected"] as const).map((s) => (
                        <Button
                            key={s ?? "all"}
                            size="sm"
                            variant={filterStatus === s ? "default" : "outline"}
                            className="h-7 text-xs capitalize"
                            onClick={() => setFilterStatus(s)}
                        >
                            {s ?? "All"}
                            <Badge variant="secondary" className="ml-1.5 text-xs">
                                {s
                                    ? allCorrections.filter((c) => c.status === s).length
                                    : allCorrections.length}
                            </Badge>
                        </Button>
                    ))}
                </div>

                {/* Bulk actions — visible only when items are selected */}
                {selected.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {selected.length} selected
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            disabled={isReviewing}
                            onClick={() => doReview({ ids: selected, action: "reject" })}
                        >
                            <X className="w-3 h-3 mr-1" /> Reject All
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                            disabled={isReviewing}
                            onClick={() => doReview({ ids: selected, action: "approve" })}
                        >
                            <Check className="w-3 h-3 mr-1" /> Approve All
                        </Button>
                    </div>
                )}
            </div>

            {corrections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {filterStatus
                        ? `No ${filterStatus} corrections.`
                        : "No corrections found."}
                </div>
            ) : (
                <div className="space-y-1">
                    {/* Select-all header row */}
                    {pending.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2">
                            <Checkbox
                                checked={allPendingSelected}
                                onCheckedChange={handleSelectAll}
                            />
                            <span className="text-xs text-muted-foreground">
                                Select all pending ({pending.length})
                            </span>
                        </div>
                    )}

                    {corrections.map((c) => (
                        <CorrectionRow
                            key={c.id}
                            correction={c}
                            selected={selected.includes(c.id)}
                            onToggle={handleToggle}
                            onReview={(ids, action) => doReview({ ids, action })}
                            isReviewing={isReviewing}
                            onSeek={seek}
                            nodeRef={(node) => {
                                if (node) rowNodesRef.current.set(c.id, node);
                                else rowNodesRef.current.delete(c.id);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProjectReview = () => {
    const { id: fileId } = useParams<{ id: string }>();
    const [searchParams]  = useSearchParams();
    const navigate        = useNavigate();

    // Start on the tab that AdminPanel linked to
    const defaultTab = searchParams.get("type") === "translation" ? "translation" : "transcription";
    const [activeTab, setActiveTab] = useState(defaultTab);

    // ── Audio refs (ref-based, zero re-renders) ──────────────────────────────────
    const audioRef            = useRef<HTMLAudioElement>(null);
    const currentTimeRef      = useRef(0);
    const progressBarRef      = useRef<HTMLDivElement>(null);
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const durationLabelRef    = useRef<HTMLSpanElement>(null);

    // Each CorrectionTab registers { nodes, corrections } here by taskType.
    // The timeupdate handler reads only the entry for the currently active tab.
    const tabDataRef = useRef<
        Map<TaskType, { nodes: Map<string, HTMLDivElement>; corrections: CorrectionRecord[] }>
    >(new Map());

    // Tracks which correction row is currently highlighted so we can un-highlight it
    const activeHighlightRef = useRef<{ tabType: TaskType; id: string } | null>(null);

    const [isPlaying, setIsPlaying]       = useState(false);
    const [duration, setDuration]         = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    // ── Queries ──────────────────────────────────────────────────────────────────
    const { data: fileData } = useQuery({
        queryKey: ["file", fileId],
        queryFn: () => getFileByIdApi(fileId!),
        enabled: !!fileId,
    });

    const { data: urlData } = useQuery({
        queryKey: ["fileUrl", fileId],
        queryFn: () => getFileUrlApi(fileId!),
        enabled: !!fileId,
        staleTime: 1000 * 60 * 50,
    });

    const file     = fileData?.data;
    const audioUrl = urlData?.data?.download_url ?? "";

    // ── Set audio src imperatively ────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;
        audio.src = audioUrl;
        audio.load();
    }, [audioUrl]);

    // ── Audio event listeners ─────────────────────────────────────────────────────
    // Re-registers when activeTab changes so onTimeUpdate always reads the right entry.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            const time = audio.currentTime;
            const dur  = audio.duration || 0;
            currentTimeRef.current = time;

            // Progress bar & time label — direct DOM, no setState
            if (progressBarRef.current && dur > 0) {
                progressBarRef.current.style.width = `${(time / dur) * 100}%`;
            }
            if (currentTimeLabelRef.current) {
                currentTimeLabelRef.current.textContent = formatTime(time);
            }

            // Highlight: find the correction in the active tab whose window contains time
            const tabData = tabDataRef.current.get(activeTab as TaskType);
            if (!tabData) return;

            const match = tabData.corrections.find(
                (c) => time >= c.start_timestamp && time < c.end_timestamp,
            );
            const newId = match?.id ?? null;
            const prev  = activeHighlightRef.current;

            if (newId === prev?.id) return; // nothing changed

            // Remove previous highlight
            if (prev) {
                const prevEntry = tabDataRef.current.get(prev.tabType);
                const prevEl    = prevEntry?.nodes.get(prev.id);
                if (prevEl) {
                    prevEl.classList.remove("border-primary/40", "bg-primary/5");
                    prevEl.classList.add("border-transparent");
                }
            }

            // Apply new highlight
            if (newId) {
                const nextEl = tabData.nodes.get(newId);
                if (nextEl) {
                    nextEl.classList.remove("border-transparent");
                    nextEl.classList.add("border-primary/40", "bg-primary/5");
                    nextEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
                activeHighlightRef.current = { tabType: activeTab as TaskType, id: newId };
            } else {
                activeHighlightRef.current = null;
            }
        };

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            if (durationLabelRef.current) {
                durationLabelRef.current.textContent = formatTime(audio.duration);
            }
        };

        const onPlay  = () => setIsPlaying(true);
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
    }, [activeTab]); // re-subscribe on tab switch

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

    // Called by each CorrectionTab to register its node map + correction data
    const handleRegisterNodes = useCallback(
        (
            taskType: TaskType,
            nodes: Map<string, HTMLDivElement>,
            corrections: CorrectionRecord[],
        ) => {
            tabDataRef.current.set(taskType, { nodes, corrections });
        },
        [],
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <audio ref={audioRef} preload="metadata" className="hidden" />

            <main className="container mx-auto px-4 py-8">
                {/* ── Page header ── */}
                <div className="mb-6">
                    <Button
                        variant="outline"
                        size="sm"
                        className="mb-4"
                        onClick={() => navigate("/admin")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Admin Panel
                    </Button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                Project Review
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {file?.file_name ?? "Loading..."}
                            </p>
                        </div>
                        {file?.speaker && (
                            <Badge variant="outline" className="shrink-0">
                                {file.speaker.name}
                            </Badge>
                        )}
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
                                {/* Progress bar (click to seek) */}
                                <div
                                    className="w-full h-3 bg-secondary rounded-full cursor-pointer relative overflow-hidden"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        seek(
                                            ((e.clientX - rect.left) / rect.width) * duration,
                                        );
                                    }}
                                >
                                    <div
                                        ref={progressBarRef}
                                        className="bg-primary h-full rounded-full absolute top-0 left-0"
                                        style={{ width: "0%", transition: "none" }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span ref={currentTimeLabelRef}>0:00</span>
                                    <span ref={durationLabelRef}>0:00</span>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            seek(Math.max(0, currentTimeRef.current - 5))
                                        }
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="w-10 h-10 rounded-full p-0"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying
                                            ? <Pause className="w-4 h-4" />
                                            : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            seek(Math.min(duration, currentTimeRef.current + 5))
                                        }
                                    >
                                        <RotateCw className="w-4 h-4" />
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
                                                    playbackRate === rate ? "default" : "outline"
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

                    {/* ── Corrections ── */}
                    <div className="lg:col-span-3">
                        <Card className="border-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Corrections Review</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="transcription">
                                            Transcription
                                        </TabsTrigger>
                                        <TabsTrigger value="translation">
                                            Translation
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="transcription">
                                        <CorrectionTab
                                            taskType="transcription"
                                            fileId={fileId!}
                                            seek={seek}
                                            onRegisterNodes={handleRegisterNodes}
                                        />
                                    </TabsContent>

                                    <TabsContent value="translation">
                                        <CorrectionTab
                                            taskType="translation"
                                            fileId={fileId!}
                                            seek={seek}
                                            onRegisterNodes={handleRegisterNodes}
                                        />
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

export default ProjectReview;