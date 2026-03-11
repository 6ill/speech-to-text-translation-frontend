import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertTriangle,
    Users,
    FileText,
    Mic,
    Eye,
    Loader2,
    AlertCircle,
    Clock,
    Users2,
} from "lucide-react";
import { getAdminStatsApi } from "@/api/admin";
import { getFilesApi } from "@/api/files";
import { FileRecord, FileStatus, POLLING_STATUSES } from "@/types";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<FileStatus, { label: string; className: string }> = {
    uploading:    { label: "Uploading",    className: "bg-blue-500/10 text-blue-600" },
    uploaded:     { label: "Uploaded",     className: "bg-blue-500/10 text-blue-600" },
    transcribing: { label: "Transcribing", className: "bg-yellow-500/10 text-yellow-600" },
    transcribed:  { label: "Transcribed",  className: "bg-teal-500/10 text-teal-600" },
    translating:  { label: "Translating",  className: "bg-purple-500/10 text-purple-600" },
    translated:   { label: "Translated",   className: "bg-green-500/10 text-green-600" },
};

function formatDuration(seconds: number): string {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function StatCard({
    label,
    value,
    icon: Icon,
    highlight,
}: {
    label: string;
    value: number | undefined;
    icon: React.ElementType;
    highlight?: boolean;
}) {
    return (
        <Card className="border-primary/10 bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${highlight ? "text-destructive" : "text-primary"}`} />
            </CardHeader>
            <CardContent>
                {value === undefined ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                    <div className={`text-2xl font-bold ${highlight && value > 0 ? "text-destructive" : "text-foreground"}`}>
                        {value.toLocaleString()}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function FileRow({ file }: { file: FileRecord }) {
    const navigate = useNavigate();
    const isProcessing = POLLING_STATUSES.includes(file.status);
    const config = STATUS_CONFIG[file.status];

    const canReview =
        file.status === "transcribed" || file.status === "translated";

    const reviewPath =
        file.status === "translated"
            ? `/admin/review/${file.id}?type=translation`
            : `/admin/review/${file.id}?type=transcription`;

    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-smooth">
            <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate max-w-xs">
                        {file.file_name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                        {file.speaker && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mic className="w-3 h-3" />
                                {file.speaker.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatDuration(file.duration_seconds)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <Badge className={`border-0 text-xs ${config.className}`}>
                    {isProcessing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    {config.label}
                </Badge>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={!canReview}
                    onClick={() => navigate(reviewPath)}
                >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Review
                </Button>
            </div>
        </div>
    );
}


function FileListContent({ files }: { files: FileRecord[] }) {
    if (files.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No files found.
            </div>
        );
    }
    return (
        <div className="space-y-2">
            {files.map((file) => (
                <FileRow key={file.id} file={file} />
            ))}
        </div>
    );
}

function FileListTabs({ files }: { files: FileRecord[] }) {
    const [activeTab, setActiveTab] = useState("all");

    const transcribed = files.filter((f) => f.status === "transcribed");
    const translated  = files.filter((f) => f.status === "translated");

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                    All
                    <Badge variant="secondary" className="ml-2 text-xs">{files.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="transcribed">
                    Transcribed
                    <Badge variant="secondary" className="ml-2 text-xs">{transcribed.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="translated">
                    Translated
                    <Badge variant="secondary" className="ml-2 text-xs">{translated.length}</Badge>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
                <FileListContent files={files} />
            </TabsContent>
            <TabsContent value="transcribed">
                <FileListContent files={transcribed} />
            </TabsContent>
            <TabsContent value="translated">
                <FileListContent files={translated} />
            </TabsContent>
        </Tabs>
    );
}

const AdminPanel = () => {
    const navigate = useNavigate();
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ["adminStats"],
        queryFn: getAdminStatsApi,
        staleTime: 1000 * 60,
    });

    const { data: filesData, isLoading: isFilesLoading, isError: isFilesError } = useQuery({
        queryKey: ["adminFiles"],
        queryFn: () => getFilesApi(1, 100),
        staleTime: 1000 * 30,
        refetchInterval: (query) => {
            const files: FileRecord[] = query.state.data?.data ?? [];
            return files.some((f) => POLLING_STATUSES.includes(f.status)) ? 5000 : false;
        },
    });

    const stats = statsData?.data;
    const files: FileRecord[] = filesData?.data ?? [];

    const statCards = [
        { label: "Total Users",          value: stats?.total_users,          icon: Users,         highlight: false },
        { label: "Total Files",           value: stats?.total_files,          icon: FileText,      highlight: false },
        { label: "Speakers",              value: stats?.total_speakers,       icon: Mic,           highlight: false },
        { label: "Pending Corrections",   value: stats?.pending_corrections,  icon: AlertTriangle, highlight: true  },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
                        <p className="text-muted-foreground">Manage user contributions and system quality</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin/people")}>
                        <Users2 className="w-4 h-4 mr-2" />
                        Manage Speakers
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card) => (
                        <StatCard
                            key={card.label}
                            label={card.label}
                            value={isStatsLoading ? undefined : card.value}
                            icon={card.icon}
                            highlight={card.highlight}
                        />
                    ))}
                </div>

                <Card className="border-primary/10 bg-gradient-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isFilesLoading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading files...</span>
                            </div>
                        ) : isFilesError ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-destructive">
                                <AlertCircle className="w-5 h-5" />
                                <span>Failed to load files.</span>
                            </div>
                        ) : (
                            <FileListTabs files={files} />
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminPanel;