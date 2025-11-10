import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Languages, FileText, ArrowRight } from "lucide-react";

const ProjectResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Sample data - replace with actual data fetching
  const project = {
    title: "Biology Lecture - Cell Structure",
    duration: "45:32",
    hasTranscription: true,
    hasTranslation: false, // Change to true to see both tabs
    transcriptionSegments: [
      { timestamp: "00:00", text: "Selamat pagi semua, hari ini kita akan membahas tentang struktur sel." },
      { timestamp: "00:15", text: "Sel adalah unit dasar kehidupan. Semua makhluk hidup tersusun dari sel." },
      { timestamp: "00:30", text: "Ada dua jenis sel utama: sel prokariotik dan sel eukariotik." },
      { timestamp: "00:45", text: "Sel prokariotik tidak memiliki nukleus, sedangkan sel eukariotik memiliki nukleus." },
      { timestamp: "01:00", text: "Mari kita lihat bagian-bagian dari sel eukariotik secara lebih detail." },
    ],
    translationSegments: [
      { timestamp: "00:00", indonesian: "Selamat pagi semua, hari ini kita akan membahas tentang struktur sel.", english: "Good morning everyone, today we will discuss about cell structure." },
      { timestamp: "00:15", indonesian: "Sel adalah unit dasar kehidupan. Semua makhluk hidup tersusun dari sel.", english: "The cell is the basic unit of life. All living things are made up of cells." },
      { timestamp: "00:30", indonesian: "Ada dua jenis sel utama: sel prokariotik dan sel eukariotik.", english: "There are two main types of cells: prokaryotic cells and eukaryotic cells." },
      { timestamp: "00:45", indonesian: "Sel prokariotik tidak memiliki nukleus, sedangkan sel eukariotik memiliki nukleus.", english: "Prokaryotic cells do not have a nucleus, while eukaryotic cells have a nucleus." },
      { timestamp: "01:00", indonesian: "Mari kita lihat bagian-bagian dari sel eukariotik secara lebih detail.", english: "Let's look at the parts of a eukaryotic cell in more detail." },
    ],
  };

  const handleExportTranscription = () => {
    const text = project.transcriptionSegments
      .map(seg => `[${seg.timestamp}] ${seg.text}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}-transcription.txt`;
    a.click();
  };

  const handleExportTranslation = () => {
    const text = project.translationSegments
      .map(seg => `[${seg.timestamp}]\nIndonesian: ${seg.indonesian}\nEnglish: ${seg.english}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}-translation.txt`;
    a.click();
  };

  const handleContinueToTranslation = () => {
    navigate(`/translate?project=${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{project.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Duration: {project.duration}</span>
                  {project.hasTranscription && (
                    <Badge variant="secondary">
                      <FileText className="w-3 h-3 mr-1" />
                      Transcription Complete
                    </Badge>
                  )}
                  {project.hasTranslation && (
                    <Badge variant="secondary">
                      <Languages className="w-3 h-3 mr-1" />
                      Translation Complete
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="transcription" className="space-y-6">
            <TabsList>
              {project.hasTranscription && (
                <TabsTrigger value="transcription">Transcription</TabsTrigger>
              )}
              {project.hasTranslation && (
                <TabsTrigger value="translation">Translation</TabsTrigger>
              )}
            </TabsList>

            {project.hasTranscription && (
              <TabsContent value="transcription">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Indonesian Transcription</CardTitle>
                      <div className="flex gap-2">
                        <Button onClick={handleExportTranscription} variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export Transcription
                        </Button>
                        {!project.hasTranslation && (
                          <Button onClick={handleContinueToTranslation} variant="academic">
                            <Languages className="w-4 h-4 mr-2" />
                            Continue to Translation
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.transcriptionSegments.map((segment, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg bg-card/50">
                          <div className="text-xs text-muted-foreground mb-2 font-mono">
                            {segment.timestamp}
                          </div>
                          <p className="text-foreground">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {project.hasTranslation && (
              <TabsContent value="translation">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Transcription & Translation</CardTitle>
                      <Button onClick={handleExportTranslation} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Translation
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.translationSegments.map((segment, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg bg-card/50">
                          <div className="text-xs text-muted-foreground mb-3 font-mono">
                            {segment.timestamp}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Indonesian</div>
                              <p className="text-foreground">{segment.indonesian}</p>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">English</div>
                              <p className="text-foreground">{segment.english}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProjectResults;
