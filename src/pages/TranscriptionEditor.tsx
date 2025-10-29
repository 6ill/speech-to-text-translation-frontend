import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, SkipBack, SkipForward, Save, Edit, Volume2, ArrowRight } from "lucide-react";
import TimestampEditor from "@/components/TimestampEditor";

const TranscriptionEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 83; // 1:23 in seconds

  const [transcriptionSegments, setTranscriptionSegments] = useState([
    {
      id: "1",
      startTime: 0,
      endTime: 15,
      text: "Selamat pagi semuanya, hari ini kita akan membahas tentang algoritma sorting.",
      originalText: "Selamat pagi semuanya, hari ini kita akan membahas algoritma sorting.",
      isEdited: true,
      editedBy: "Sarah A.",
      confidence: 95
    },
    {
      id: "2", 
      startTime: 15,
      endTime: 35,
      text: "Algoritma sorting adalah proses pengurutan data dari yang terkecil ke terbesar atau sebaliknya.",
      confidence: 92
    },
    {
      id: "3",
      startTime: 35,
      endTime: 55,
      text: "Ada beberapa jenis algoritma sorting yang akan kita pelajari hari ini.",
      confidence: 88
    },
    {
      id: "4",
      startTime: 55,
      endTime: 83,
      text: "Yaitu bubble sort, selection sort, dan insertion sort. Mari kita mulai dengan bubble sort.",
      confidence: 91
    }
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscriptionEdit = (segmentId: string, newText: string) => {
    setTranscriptionSegments(prev => 
      prev.map(segment => 
        segment.id === segmentId 
          ? { 
              ...segment, 
              originalText: segment.originalText || segment.text,
              text: newText, 
              isEdited: true,
              editedBy: "Current User"
            }
          : segment
      )
    );
  };

  const handleSaveAll = () => {
    console.log("Saving all transcription changes:", transcriptionSegments);
    // Here you would save all changes to backend
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
            <div className="flex items-center space-x-2">
              <Badge className="bg-academic-teal text-white">In Progress</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">Transcription Phase</Badge>
            </div>
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
                    <Button variant="outline">
                      Export Transcription
                    </Button>
                    <Button variant="hero">
                      Proceed to Translation
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="timestamp" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="timestamp">Timestamp View</TabsTrigger>
                    <TabsTrigger value="full-text">Full Text View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="timestamp" className="space-y-4">
                    <div className="max-h-[500px] overflow-y-auto">
                      <TimestampEditor
                        segments={transcriptionSegments}
                        onSegmentEdit={handleTranscriptionEdit}
                        currentTime={currentTime}
                        type="transcription"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="full-text" className="space-y-4">
                    <div className="min-h-[400px] p-4 bg-secondary rounded-lg">
                      <p className="text-base leading-relaxed text-foreground">
                        {transcriptionSegments.map(segment => segment.text).join(' ')}
                      </p>
                    </div>
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

export default TranscriptionEditor;