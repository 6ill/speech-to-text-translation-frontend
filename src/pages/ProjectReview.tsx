import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, Play, Pause, ArrowLeft, Clock, User, Edit } from "lucide-react";

interface Edit {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  segmentId: string;
  startTime: number;
  endTime: number;
  originalText: string;
  editedText: string;
  type: 'transcription' | 'translation';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

const ProjectReview = () => {
  const [selectedEdits, setSelectedEdits] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 83;

  const [projectEdits] = useState<Edit[]>([
    {
      id: "edit-1",
      userId: "user-1",
      userName: "Sarah Ahmad", 
      timestamp: "2 hours ago",
      segmentId: "1",
      startTime: 0,
      endTime: 15,
      originalText: "Selamat pagi semuanya, hari ini kita akan membahas algoritma sorting.",
      editedText: "Selamat pagi semuanya, hari ini kita akan membahas tentang algoritma sorting.",
      type: "transcription",
      confidence: 95,
      status: "pending",
      submittedAt: "2024-03-15T10:30:00Z"
    },
    {
      id: "edit-2", 
      userId: "user-1",
      userName: "Sarah Ahmad",
      timestamp: "2 hours ago",
      segmentId: "1",
      startTime: 0,
      endTime: 15,
      originalText: "Good morning everyone, today we will discuss sorting algorithm.",
      editedText: "Good morning everyone, today we will discuss about sorting algorithms.",
      type: "translation",
      confidence: 89,
      status: "pending",
      submittedAt: "2024-03-15T10:32:00Z"
    },
    {
      id: "edit-3",
      userId: "user-2", 
      userName: "Budi Santoso",
      timestamp: "4 hours ago",
      segmentId: "2",
      startTime: 15,
      endTime: 35,
      originalText: "Sorting algorithm is process of arranging data from smallest to largest or vice versa.",
      editedText: "Sorting algorithm is the process of arranging data from smallest to largest or vice versa.",
      type: "translation",
      confidence: 92,
      status: "pending", 
      submittedAt: "2024-03-15T08:15:00Z"
    },
    {
      id: "edit-4",
      userId: "user-3",
      userName: "Maya Putri",
      timestamp: "1 day ago",
      segmentId: "3",
      startTime: 35,
      endTime: 55,
      originalText: "Ada beberapa jenis algoritma sorting yang akan kita pelajari hari ini",
      editedText: "Ada beberapa jenis algoritma sorting yang akan kita pelajari hari ini.",
      type: "transcription",
      confidence: 98,
      status: "approved",
      submittedAt: "2024-03-14T14:20:00Z"
    }
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApprove = (editId: string) => {
    console.log("Approving edit:", editId);
    // Update edit status to approved
  };

  const handleReject = (editId: string) => {
    console.log("Rejecting edit:", editId);
    // Update edit status to rejected
  };

  const handleSelectAll = (status: 'pending' | 'approved' | 'rejected') => {
    const editsToSelect = projectEdits.filter(edit => edit.status === status);
    if (selectedEdits.length === editsToSelect.length) {
      setSelectedEdits([]);
    } else {
      setSelectedEdits(editsToSelect.map(edit => edit.id));
    }
  };

  const handleSelectEdit = (editId: string) => {
    setSelectedEdits(prev => 
      prev.includes(editId) 
        ? prev.filter(id => id !== editId)
        : [...prev, editId]
    );
  };

  const handleBulkApprove = () => {
    selectedEdits.forEach(editId => handleApprove(editId));
    setSelectedEdits([]);
  };

  const handleBulkReject = () => {
    selectedEdits.forEach(editId => handleReject(editId));
    setSelectedEdits([]);
  };

  const pendingEdits = projectEdits.filter(edit => edit.status === 'pending');
  const approvedEdits = projectEdits.filter(edit => edit.status === 'approved');
  const rejectedEdits = projectEdits.filter(edit => edit.status === 'rejected');

  const renderEditCard = (edit: Edit, showCheckbox: boolean = false) => (
    <Card key={edit.id} className="border-primary/10 bg-gradient-card">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {showCheckbox && (
              <Checkbox 
                checked={selectedEdits.includes(edit.id)}
                onCheckedChange={() => handleSelectEdit(edit.id)}
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{edit.userName}</span>
                </div>
                <Badge 
                  variant={edit.type === 'transcription' ? 'default' : 'secondary'}
                  className={edit.type === 'transcription' ? 'bg-blue-500' : 'bg-accent'}
                >
                  {edit.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(edit.startTime)} - {formatTime(edit.endTime)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {edit.confidence}% confidence
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-medium mb-1">Original:</p>
                  <p className="text-sm text-red-700 line-through">{edit.originalText}</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium mb-1">Edited:</p>
                  <p className="text-sm text-green-700">{edit.editedText}</p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">{edit.timestamp}</p>
            </div>
          </div>
          
          {edit.status === 'pending' && (
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleReject(edit.id)}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button 
                variant="academic" 
                size="sm"
                onClick={() => handleApprove(edit.id)}
              >
                <Check className="w-4 h-4" />
                Approve
              </Button>
            </div>
          )}
          
          {edit.status === 'approved' && (
            <Badge className="bg-green-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          )}
          
          {edit.status === 'rejected' && (
            <Badge className="bg-red-500 text-white">
              <X className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Panel
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Project Review</h1>
              <p className="text-muted-foreground">Kuliah Algoritma dan Struktur Data - Pertemuan 5</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-academic-teal text-white">
                <Edit className="w-3 h-3 mr-1" />
                {pendingEdits.length} pending edits
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Audio Player */}
          <div className="lg:col-span-1">
            <Card className="border-primary/10 bg-gradient-card sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Audio Playback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-16 bg-secondary rounded-lg flex items-center justify-center">
                  <div className="flex items-end space-x-1 h-12">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-t transition-smooth ${
                          i <= (currentTime / duration) * 30 
                            ? 'bg-primary' 
                            : 'bg-muted'
                        }`}
                        style={{ 
                          height: `${Math.random() * 60 + 20}%` 
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
                
                <div className="flex items-center justify-center">
                  <Button 
                    variant="academic"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews Content */}
          <div className="lg:col-span-3">
            <Card className="border-primary/10 bg-gradient-card">
              <CardHeader>
                <CardTitle>User Contributions Review</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">
                      Pending ({pendingEdits.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({approvedEdits.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({rejectedEdits.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending" className="space-y-4">
                    {pendingEdits.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedEdits.length === pendingEdits.length && pendingEdits.length > 0}
                              onCheckedChange={() => handleSelectAll('pending')}
                            />
                            <span className="text-sm text-muted-foreground">Select All</span>
                          </div>
                          {selectedEdits.length > 0 && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleBulkReject}
                                className="text-destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject ({selectedEdits.length})
                              </Button>
                              <Button 
                                variant="academic" 
                                size="sm"
                                onClick={handleBulkApprove}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve ({selectedEdits.length})
                              </Button>
                            </div>
                          )}
                        </div>
                        {pendingEdits.map(edit => renderEditCard(edit, true))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-foreground mb-2">No Pending Reviews</h3>
                        <p className="text-muted-foreground">All user contributions have been reviewed</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="approved" className="space-y-4">
                    {approvedEdits.length > 0 ? (
                      <div className="space-y-4">
                        {approvedEdits.map(edit => renderEditCard(edit, false))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-foreground mb-2">No Approved Edits</h3>
                        <p className="text-muted-foreground">No contributions have been approved yet</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="rejected" className="space-y-4">
                    {rejectedEdits.length > 0 ? (
                      <div className="space-y-4">
                        {rejectedEdits.map(edit => renderEditCard(edit, false))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-foreground mb-2">No Rejected Edits</h3>
                        <p className="text-muted-foreground">No contributions have been rejected</p>
                      </div>
                    )}
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

export default ProjectReview;