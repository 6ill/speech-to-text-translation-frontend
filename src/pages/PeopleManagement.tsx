import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft, Plus, Pencil, Trash2, Loader2, AlertCircle, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPeopleApi } from "@/api/files";
import { createPersonApi, updatePersonApi, deletePersonApi } from "@/api/corrections";
import { Person } from "@/types";

// ─── Form Dialog (Add / Edit) ─────────────────────────────────────────────────

interface PersonFormDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    initial?: Person | null;
    onSaved: () => void;
}

function PersonFormDialog({ open, onOpenChange, initial, onSaved }: PersonFormDialogProps) {
    const { toast } = useToast();
    const isEdit = !!initial;

    const [name, setName]   = useState("");
    const [email, setEmail] = useState("");

    // Sync fields whenever the dialog opens or the target person changes
    useEffect(() => {
        if (open) {
            setName(initial?.name ?? "");
            setEmail(initial?.email ?? "");
        }
    }, [open, initial]);

    const handleOpenChange = (v: boolean) => {
        onOpenChange(v);
    };

    const { mutate: save, isPending } = useMutation({
        mutationFn: () =>
            isEdit
                ? updatePersonApi(initial!.id, { name: name.trim(), email: email.trim() })
                : createPersonApi({ name: name.trim(), email: email.trim() }),
        onSuccess: (res) => {
            toast({ title: res.message });
            onSaved();
            onOpenChange(false);
        },
        onError: (err: any) => {
            const raw = err?.response?.data?.detail;
            let description = "Something went wrong.";
            if (Array.isArray(raw)) {
                // Pydantic 422 — extract the human-readable msg from each error
                description = raw.map((e: any) => e?.msg ?? "Invalid value").join("\n");
            } else if (typeof raw === "string") {
                description = raw;
            }
            toast({ title: "Failed to save", description, variant: "destructive" });
        },
    });

    // Mirrors Pydantic's basic rules: something@something.tld
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    const valid = name.trim().length >= 2 && emailValid;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Speaker" : "Add Speaker"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="person-name">Name</Label>
                        <Input
                            id="person-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Dr. Budi Santoso"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="person-email">Email</Label>
                        <Input
                            id="person-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. budi@university.ac.id"
                            className={email.trim() && !emailValid ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {email.trim() && !emailValid && (
                            <p className="text-xs text-destructive">
                                Enter a valid email address (e.g. name@domain.com)
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => save()} disabled={isPending || !valid}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isEdit ? "Save Changes" : "Add Speaker"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PeopleManagement = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formOpen, setFormOpen]         = useState(false);
    const [editing, setEditing]           = useState<Person | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["people"],
        queryFn: getPeopleApi,
    });
    const people: Person[] = data?.data ?? [];

    const { mutate: doDelete, isPending: isDeleting } = useMutation({
        mutationFn: (id: string) => deletePersonApi(id),
        onSuccess: () => {
            toast({ title: "Speaker deleted" });
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ["people"] });
        },
        onError: () =>
            toast({ title: "Failed to delete speaker", variant: "destructive" }),
    });

    const handleOpenAdd = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (person: Person) => {
        setEditing(person);
        setFormOpen(true);
    };

    const handleSaved = () => {
        queryClient.invalidateQueries({ queryKey: ["people"] });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* ── Header ── */}
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

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                Speaker Management
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage registered speakers for audio files
                            </p>
                        </div>
                        <Button onClick={handleOpenAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Speaker
                        </Button>
                    </div>
                </div>

                {/* ── Table Card ── */}
                <Card className="border-primary/10 bg-gradient-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="w-4 h-4 text-primary" />
                            Speakers
                            {!isLoading && (
                                <Badge variant="secondary" className="ml-1">
                                    {people.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading speakers...</span>
                            </div>
                        ) : isError ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-destructive">
                                <AlertCircle className="w-5 h-5" />
                                <span>Failed to load speakers.</span>
                            </div>
                        ) : people.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No speakers registered yet.
                                <br />
                                <Button
                                    variant="link"
                                    className="mt-2 text-primary"
                                    onClick={handleOpenAdd}
                                >
                                    Add the first speaker
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                                                Name
                                            </th>
                                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                                                Email
                                            </th>
                                            <th className="py-3 px-4 w-24" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {people.map((person) => (
                                            <tr
                                                key={person.id}
                                                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-medium text-foreground">
                                                    {person.name}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {person.email}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => handleOpenEdit(person)}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(person)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* ── Add/Edit Dialog ── */}
            <PersonFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                initial={editing}
                onSaved={handleSaved}
            />

            {/* ── Delete Confirm ── */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Speaker</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">{deleteTarget?.name}</span>?
                            This will unlink them from all associated files.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTarget && doDelete(deleteTarget.id)}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PeopleManagement;