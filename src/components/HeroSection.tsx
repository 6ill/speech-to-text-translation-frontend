import { Button } from "@/components/ui/button";
import { Upload, FileAudio, Languages, Users } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="py-20 bg-gradient-hero text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Collaborative
            <span className="block text-accent-light">Audio Transcription</span>
            & Translation
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
            Upload your Indonesian classroom recordings and collaborate with the community 
            to create accurate transcriptions and English translations through crowdsourcing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
              <Upload className="w-5 h-5" />
              Upload Recording
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
              <Languages className="w-5 h-5" />
              Browse Projects
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileAudio className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload & Transcribe</h3>
              <p className="text-white/80">Upload audio/video files and get AI-powered transcription in Indonesian</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborate & Edit</h3>
              <p className="text-white/80">Community members can edit and improve transcription accuracy</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Translate & Learn</h3>
              <p className="text-white/80">Translate to English and contribute to machine learning improvement</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;