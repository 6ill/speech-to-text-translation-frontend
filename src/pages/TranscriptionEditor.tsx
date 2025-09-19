import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, Save, Edit, Check, X, Volume2 } from "lucide-react";

const TranscriptionEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState(
    "Selamat pagi semuanya, hari ini kita akan membahas tentang algoritma sorting. Algoritma sorting adalah proses pengurutan data dari yang terkecil ke terbesar atau sebaliknya. Ada beberapa jenis algoritma sorting yang akan kita pelajari hari ini, yaitu bubble sort, selection sort, dan insertion sort."
  );

  const duration = 83; // 1:23 in seconds

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would save the transcription
    console.log("Saving transcription:", transcriptionText);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original text or fetch from server
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transcription Editor</h1>
              <p className="text-muted-foreground">Kuliah Algoritma dan Struktur Data - Pertemuan 5</p>
            </div>
            <Badge className="bg-academic-teal text-white">In Progress</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Audio Player */}
          <div className="lg:col-span-1">
            <Card className="border-primary/10 bg-gradient-card sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span>Audio Player</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Waveform placeholder */}
                <div className="h-24 bg-secondary rounded-lg flex items-center justify-center">
                  <div className="flex items-end space-x-1 h-16">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-t transition-smooth ${
                          i <= (currentTime / duration) * 50 
                            ? 'bg-primary' 
                            : 'bg-muted'
                        }`}
                        style={{ 
                          height: `${Math.random() * 60 + 10}%` 
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-smooth" 
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="academic"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Playback Speed</p>
                  <div className="flex justify-center space-x-2">
                    {['0.75x', '1x', '1.25x', '1.5x'].map((speed) => (
                      <Button 
                        key={speed}
                        variant={speed === '1x' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                      >
                        {speed}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcription Editor */}
          <div className="lg:col-span-2">
            <Card className="border-primary/10 bg-gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Edit className="w-5 h-5 text-primary" />
                    <span>Indonesian Transcription</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                        <Button variant="academic" size="sm" onClick={handleSave}>
                          <Check className="w-4 h-4" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={transcriptionText}
                    onChange={(e) => setTranscriptionText(e.target.value)}
                    className="min-h-[400px] text-base leading-relaxed border-primary/20 focus:border-primary"
                    placeholder="Edit the transcription here..."
                  />
                ) : (
                  <div className="min-h-[400px] p-4 bg-secondary rounded-lg">
                    <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                      {transcriptionText}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Accuracy: <span className="font-medium text-primary">87%</span></p>
                    <p>Contributors: <span className="font-medium">5 people</span></p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button variant="outline">
                      <Save className="w-4 h-4" />
                      Save Draft
                    </Button>
                    <Button variant="hero">
                      Proceed to Translation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Info */}
            <Card className="mt-6 border-primary/10 bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Edits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Sarah Ahmad</p>
                      <p className="text-sm text-muted-foreground">Fixed pronunciation errors in minute 2-3</p>
                    </div>
                    <span className="text-xs text-muted-foreground">5 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Budi Santoso</p>
                      <p className="text-sm text-muted-foreground">Improved clarity in technical terms</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 hour ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TranscriptionEditor;