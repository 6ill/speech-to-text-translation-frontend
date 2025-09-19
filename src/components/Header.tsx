import { Button } from "@/components/ui/button";
import { Upload, FileText, Languages, Settings } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TranscriptCrowd</h1>
                <p className="text-xs text-muted-foreground">Collaborative Translation Platform</p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-foreground hover:text-primary transition-smooth">Dashboard</a>
            <a href="/upload" className="text-foreground hover:text-primary transition-smooth">Upload</a>
            <a href="/transcribe" className="text-foreground hover:text-primary transition-smooth">Transcribe</a>
            <a href="/translate" className="text-foreground hover:text-primary transition-smooth">Translate</a>
            <a href="/admin" className="text-foreground hover:text-primary transition-smooth">Admin</a>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
              Profile
            </Button>
            <Button variant="academic" size="sm">
              <Upload className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;