import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, SkipBack, SkipForward, Save, Languages, Volume2, ArrowRight } from "lucide-react";
import TimestampEditor from "@/components/TimestampEditor";

const TranslationEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 83; // 1:23 in seconds

  const [transcriptionSegments] = useState([
    {
      id: "1",
      startTime: 0,
      endTime: 15,
      text: "Selamat pagi semuanya, hari ini kita akan membahas tentang algoritma sorting.",
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

  const [translationSegments, setTranslationSegments] = useState([
    {
      id: "1",
      startTime: 0,
      endTime: 15,
      text: "Good morning everyone, today we will discuss about sorting algorithms.",
      originalText: "Good morning everyone, today we will discuss sorting algorithm.",
      isEdited: true,
      editedBy: "Sarah A.",
      confidence: 89
    },
    {
      id: "2",
      startTime: 15, 
      endTime: 35,
      text: "Sorting algorithm is the process of arranging data from smallest to largest or vice versa.",
      confidence: 94
    },
    {
      id: "3",
      startTime: 35,
      endTime: 55,
      text: "There are several types of sorting algorithms that we will learn today.",
      confidence: 92
    },
    {
      id: "4",
      startTime: 55,
      endTime: 83,
      text: "Namely bubble sort, selection sort, and insertion sort. Let's start with bubble sort.",
      confidence: 88
    }
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranslationEdit = (segmentId: string, newText: string) => {
    setTranslationSegments(prev => 
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
    console.log("Saving all translation changes:", translationSegments);
    // Here you would save all changes to backend
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Translation Editor</h1>
              <p className="text-muted-foreground">Kuliah Algoritma dan Struktur Data - Pertemuan 5</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-academic-teal text-white">In Progress</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">Translation Phase</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

          {/* Translation Content */}
          <div className="lg:col-span-3">
            <Card className="border-primary/10 bg-gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Languages className="w-5 h-5 text-primary" />
                    <span>Indonesian → English Translation</span>
                  </CardTitle>
                  <Button variant="outline">
                    Export Translation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="side-by-side" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                    <TabsTrigger value="text-only">Text Only</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="side-by-side" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span>Indonesian Transcription</span>
                        </h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                          {transcriptionSegments.map((segment) => {
                            const isCurrent = currentTime >= segment.startTime && currentTime <= segment.endTime;
                            return (
                              <Card 
                                key={segment.id}
                                className={`border transition-smooth ${
                                  isCurrent ? 'border-blue-500 bg-blue-50' : 'border-border'
                                }`}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                    </Badge>
                                    {isCurrent && (
                                      <Badge className="text-xs bg-blue-500 text-white">
                                        Playing
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm leading-relaxed text-foreground">
                                    {segment.text}
                                  </p>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-academic-teal rounded-full"></span>
                          <span>English Translation</span>
                        </h3>
                        <div className="max-h-[600px] overflow-y-auto">
                          <TimestampEditor
                            segments={translationSegments}
                            onSegmentEdit={handleTranslationEdit}
                            currentTime={currentTime}
                            type="translation"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text-only" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span>Indonesian Transcription</span>
                        </h3>
                        <div className="min-h-[400px] p-4 bg-secondary rounded-lg max-h-[600px] overflow-y-auto">
                          <p className="text-base leading-relaxed text-foreground">
                            {transcriptionSegments.map(segment => segment.text).join(' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
                          <span className="w-3 h-3 bg-academic-teal rounded-full"></span>
                          <span>English Translation</span>
                        </h3>
                        <div className="min-h-[400px] p-4 bg-secondary rounded-lg max-h-[600px] overflow-y-auto">
                          <p className="text-base leading-relaxed text-foreground">
                            {translationSegments.map(segment => segment.text).join(' ')}
                          </p>
                        </div>
                      </div>
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

export default TranslationEditor;