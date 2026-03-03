import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import ProjectReview from "./pages/ProjectReview";
import TranscriptionEditor from "./pages/TranscriptionEditor";
import TranslationEditor from "./pages/TranslationEditor";

// Auth
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 1000 * 30,
        },
    },
});

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    {/* ── Public routes ── */}
                    <Route path="/auth" element={<Auth />} />

                    {/* ── Protected: USER & ADMIN ── */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Index />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route
                            path="/file/:id/transcribe"
                            element={<TranscriptionEditor />}
                        />
                        <Route
                            path="/file/:id/translate"
                            element={<TranslationEditor />}
                        />
                    </Route>

                    {/* ── Protected: ADMIN only ── */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route
                            path="/admin/review/:id"
                            element={<ProjectReview />}
                        />
                    </Route>

                    {/* ── Catch-all ── */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
