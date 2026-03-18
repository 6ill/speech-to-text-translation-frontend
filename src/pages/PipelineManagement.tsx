import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft, Play, Loader2, AlertCircle, CheckCircle2,
    XCircle, Clock, SkipForward, Settings, History,
    ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getPipelineConfigsApi,
    updatePipelineConfigApi,
    triggerPipelineApi,
    getPipelineRunsApi,
    PipelineConfig,
    PipelineConfigUpdate,
    PipelineRunLog,
    PipelineTaskType,
} from "@/api/pipeline";


const RUN_STATUS_CONFIG: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
> = {
    running: { label: "Running",  className: "bg-blue-500/10 text-blue-600 border-blue-500/20",    icon: Loader2      },
    success: { label: "Success",  className: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
    failed:  { label: "Failed",   className: "bg-red-500/10 text-red-600 border-red-500/20",       icon: XCircle      },
    skipped: { label: "Skipped",  className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: SkipForward },
};

function formatDuration(start: string, end: string | null): string {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const s  = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
}

function MetricPair({
    label,
    baseline,
    newVal,
    metricKey,
}: {
    label: string;
    baseline: number | undefined;
    newVal: number | undefined;
    metricKey: string;
}) {
    if (baseline === undefined && newVal === undefined) return null;
    const lowerIsBetter = metricKey === "wer";
    const improved =
        baseline !== undefined && newVal !== undefined
            ? lowerIsBetter
                ? newVal < baseline
                : newVal > baseline
            : null;

    return (
        <div className="flex items-center justify-between text-xs gap-4">
            <span className="text-muted-foreground font-medium uppercase tracking-wide">
                {label}
            </span>
            <div className="flex items-center gap-2 font-mono">
                {baseline !== undefined && (
                    <span className="text-muted-foreground">{baseline.toFixed(4)}</span>
                )}
                {baseline !== undefined && newVal !== undefined && (
                    <span className="text-muted-foreground">→</span>
                )}
                {newVal !== undefined && (
                    <span
                        className={
                            improved === true
                                ? "text-green-600 font-semibold"
                                : improved === false
                                ? "text-red-500 font-semibold"
                                : "text-foreground"
                        }
                    >
                        {newVal.toFixed(4)}
                    </span>
                )}
            </div>
        </div>
    );
}


function RunRow({ run }: { run: PipelineRunLog }) {
    const [expanded, setExpanded] = useState(false);
    const config = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.failed;
    const StatusIcon = config.icon;
    const hasMetrics = run.metrics_baseline || run.metrics_new_model;

    return (
        <div className="rounded-lg border border-border bg-card">
            <div
                className="flex items-center justify-between p-3 gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => hasMetrics && setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${config.className}`}
                    >
                        <StatusIcon
                            className={`w-3 h-3 mr-1 ${run.status === "running" ? "animate-spin" : ""}`}
                        />
                        {config.label}
                    </Badge>
                    <span className="text-xs font-mono font-medium uppercase text-muted-foreground shrink-0">
                        {run.task_type}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(run.start_time), { addSuffix: true })}
                    </span>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                    <span>{run.data_samples_used} samples</span>
                    <span>{formatDuration(run.start_time, run.end_time)}</span>
                    {hasMetrics && (
                        expanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-border px-4 py-3 space-y-2">
                    {run.message && (
                        <p className="text-xs text-muted-foreground">{run.message}</p>
                    )}
                    {run.mlflow_run_id && (
                        <p className="text-xs text-muted-foreground font-mono">
                            MLflow run: {run.mlflow_run_id}
                        </p>
                    )}
                    {hasMetrics && (
                        <div className="space-y-1.5 pt-1">
                            {["wer", "bleu"].map((k) => {
                                const b = run.metrics_baseline?.[k];
                                const n = run.metrics_new_model?.[k];
                                if (b === undefined && n === undefined) return null;
                                return (
                                    <MetricPair
                                        key={k}
                                        label={k.toUpperCase()}
                                        baseline={b}
                                        newVal={n}
                                        metricKey={k}
                                    />
                                );
                            })}
                        </div>
                    )}
                    {run.end_time && (
                        <p className="text-xs text-muted-foreground">
                            Finished {format(new Date(run.end_time), "MMM d, yyyy HH:mm:ss")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

interface ConfigCardProps {
    config: PipelineConfig;
    onTriggered: () => void;
    onUpdated: () => void;
}

function ConfigCard({ config, onTriggered, onUpdated }: ConfigCardProps) {
    const { toast } = useToast();
    const [editing, setEditing] = useState(false);

    // Local form state — synced from config on open
    const [form, setForm] = useState<PipelineConfigUpdate>({});

    useEffect(() => {
        if (editing) {
            setForm({
                is_active:                     config.is_active,
                cron_schedule:                 config.cron_schedule,
                min_samples_required:          config.min_samples_required,
                learning_rate:                 config.learning_rate,
                num_epochs:                    config.num_epochs,
                batch_size:                    config.batch_size,
                evaluation_dataset_storage_key: config.evaluation_dataset_storage_key,
            });
        }
    }, [editing, config]);

    const { mutate: doTrigger, isPending: isTriggering } = useMutation({
        mutationFn: () => triggerPipelineApi(config.task_type),
        onSuccess: (res) => {
            toast({ title: res.message });
            onTriggered();
        },
        onError: (err: any) => {
            const detail = err?.response?.data?.detail ?? "Failed to trigger pipeline.";
            toast({ title: "Trigger failed", description: detail, variant: "destructive" });
        },
    });

    const { mutate: doUpdate, isPending: isSaving } = useMutation({
        mutationFn: () => updatePipelineConfigApi(config.task_type, form),
        onSuccess: (res) => {
            toast({ title: res.message });
            setEditing(false);
            onUpdated();
        },
        onError: (err: any) => {
            const raw = err?.response?.data?.detail;
            const description = Array.isArray(raw)
                ? raw.map((e: any) => e?.msg ?? "Invalid value").join(" · ")
                : (raw ?? "Something went wrong.");
            toast({ title: "Save failed", description, variant: "destructive" });
        },
    });

    const set = <K extends keyof PipelineConfigUpdate>(key: K, val: PipelineConfigUpdate[K]) =>
        setForm((prev) => ({ ...prev, [key]: val }));

    const taskLabel = config.task_type === "asr" ? "ASR" : "MT";
    const taskDesc  = config.task_type === "asr"
        ? "Automatic Speech Recognition"
        : "Machine Translation";

    return (
        <Card className="border-primary/10 bg-gradient-card">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <span className="font-mono font-bold">{taskLabel}</span>
                            <Badge
                                variant="outline"
                                className={
                                    config.is_active
                                        ? "text-xs bg-green-500/10 text-green-600 border-green-500/20"
                                        : "text-xs bg-muted text-muted-foreground"
                                }
                            >
                                {config.is_active ? "Active" : "Disabled"}
                            </Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{taskDesc}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setEditing((v) => !v)}
                        >
                            <Settings className="w-3.5 h-3.5 mr-1.5" />
                            {editing ? "Cancel" : "Configure"}
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs"
                            disabled={isTriggering || !config.is_active}
                            onClick={() => doTrigger()}
                        >
                            {isTriggering
                                ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                : <Play className="w-3.5 h-3.5 mr-1.5" />}
                            Run Now
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {!editing && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {[
                            { label: "Schedule",     value: config.cron_schedule },
                            { label: "Min Samples",  value: config.min_samples_required },
                            { label: "Epochs",       value: config.num_epochs },
                            { label: "Batch Size",   value: config.batch_size },
                            { label: "Learning Rate", value: config.learning_rate },
                            { label: "Updated",      value: formatDistanceToNow(new Date(config.updated_at), { addSuffix: true }) },
                        ].map(({ label, value }) => (
                            <div key={label} className="space-y-0.5">
                                <p className="text-muted-foreground uppercase tracking-wide text-[10px] font-medium">
                                    {label}
                                </p>
                                <p className="font-mono text-foreground">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {editing && (
                    <div className="space-y-4">
                        <Separator />

                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm">Pipeline Active</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Disabling prevents both scheduled and manual runs
                                </p>
                            </div>
                            <Switch
                                checked={form.is_active ?? config.is_active}
                                onCheckedChange={(v) => set("is_active", v)}
                            />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor={`cron-${config.task_type}`}>
                                    Cron Schedule
                                </Label>
                                <Input
                                    id={`cron-${config.task_type}`}
                                    value={form.cron_schedule ?? ""}
                                    onChange={(e) => set("cron_schedule", e.target.value)}
                                    placeholder="0 3 * * 0"
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Standard cron syntax (UTC). e.g. <span className="font-mono">0 3 * * 0</span> = every Sunday at 3 AM.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`samples-${config.task_type}`}>
                                    Min Samples Required
                                </Label>
                                <Input
                                    id={`samples-${config.task_type}`}
                                    type="number"
                                    min={1}
                                    value={form.min_samples_required ?? ""}
                                    onChange={(e) =>
                                        set("min_samples_required", Number(e.target.value))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`lr-${config.task_type}`}>
                                    Learning Rate
                                </Label>
                                <Input
                                    id={`lr-${config.task_type}`}
                                    type="number"
                                    step="0.00001"
                                    min={0.000001}
                                    value={form.learning_rate ?? ""}
                                    onChange={(e) =>
                                        set("learning_rate", parseFloat(e.target.value))
                                    }
                                    className="font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`epochs-${config.task_type}`}>
                                    Epochs
                                </Label>
                                <Input
                                    id={`epochs-${config.task_type}`}
                                    type="number"
                                    min={1}
                                    value={form.num_epochs ?? ""}
                                    onChange={(e) =>
                                        set("num_epochs", Number(e.target.value))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor={`batch-${config.task_type}`}>
                                    Batch Size
                                </Label>
                                <Input
                                    id={`batch-${config.task_type}`}
                                    type="number"
                                    min={1}
                                    value={form.batch_size ?? ""}
                                    onChange={(e) =>
                                        set("batch_size", Number(e.target.value))
                                    }
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor={`eval-${config.task_type}`}>
                                    Evaluation Dataset Storage Key
                                </Label>
                                <Input
                                    id={`eval-${config.task_type}`}
                                    value={form.evaluation_dataset_storage_key ?? ""}
                                    onChange={(e) =>
                                        set("evaluation_dataset_storage_key", e.target.value)
                                    }
                                    placeholder="e.g. datasets/asr_eval_v1.json"
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                disabled={isSaving}
                                onClick={() => doUpdate()}
                            >
                                {isSaving && (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PipelineManagement = () => {
    const navigate     = useNavigate();
    const queryClient  = useQueryClient();
    const [taskFilter, setTaskFilter] = useState<PipelineTaskType | undefined>(undefined);

    // ── Configs ──────────────────────────────────────────────────────────────
    const {
        data: configData,
        isLoading: isConfigLoading,
        isError: isConfigError,
    } = useQuery({
        queryKey: ["pipelineConfigs"],
        queryFn: getPipelineConfigsApi,
    });

    const configs: PipelineConfig[] = configData?.data ?? [];

    // ── Run logs ─────────────────────────────────────────────────────────────
    const {
        data: runsData,
        isLoading: isRunsLoading,
        isError: isRunsError,
    } = useQuery({
        queryKey: ["pipelineRuns", taskFilter],
        queryFn: () => getPipelineRunsApi({ task_type: taskFilter, limit: 50 }),
        // Poll while any run is in "running" state
        refetchInterval: (query) => {
            const runs: PipelineRunLog[] = query.state.data?.data ?? [];
            return runs.some((r) => r.status === "running") ? 4000 : false;
        },
    });

    const runs: PipelineRunLog[] = runsData?.data ?? [];
    const hasRunning = runs.some((r) => r.status === "running");

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["pipelineRuns"] });
        queryClient.invalidateQueries({ queryKey: ["pipelineConfigs"] });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
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
                    <h1 className="text-3xl font-bold text-foreground">
                        Pipeline Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure and trigger the continual learning pipeline
                    </p>
                </div>

                <section className="mb-8">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Pipeline Configuration
                    </h2>

                    {isConfigLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading configs...</span>
                        </div>
                    ) : isConfigError ? (
                        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            <span>Failed to load pipeline configs.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {configs.map((cfg) => (
                                <ConfigCard
                                    key={cfg.task_type}
                                    config={cfg}
                                    onTriggered={invalidateAll}
                                    onUpdated={invalidateAll}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Run History
                            {hasRunning && (
                                <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20"
                                >
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Live
                                </Badge>
                            )}
                        </h2>

                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                {([undefined, "asr", "mt"] as const).map((t) => (
                                    <Button
                                        key={t ?? "all"}
                                        size="sm"
                                        variant={taskFilter === t ? "default" : "outline"}
                                        className="h-7 text-xs"
                                        onClick={() => setTaskFilter(t)}
                                    >
                                        {t ? t.toUpperCase() : "All"}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={invalidateAll}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>

                    {isRunsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading run history...</span>
                        </div>
                    ) : isRunsError ? (
                        <div className="flex items-center gap-2 text-destructive py-12 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            <span>Failed to load run history.</span>
                        </div>
                    ) : runs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No pipeline runs yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {runs.map((run) => (
                                <RunRow key={run.id} run={run} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default PipelineManagement;