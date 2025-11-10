import Header from "@/components/Header";
import UploadSection from "@/components/UploadSection";

const Upload = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Upload Recording</h1>
            <p className="text-muted-foreground">Upload your audio or video file to start transcription</p>
          </div>
          <UploadSection />
        </div>
      </main>
    </div>
  );
};

export default Upload;
