import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Eye, AlertTriangle, Users, FileText, TrendingUp, Play, Clock, Upload } from "lucide-react";
import { useState } from "react";

const AdminPanel = () => {
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const pendingFiles = [
    {
      id: 1,
      user: "Sarah Ahmad",
      fileName: "Kuliah_Algoritma_Pertemuan_5.mp4",
      title: "Kuliah Algoritma - Pertemuan 5",
      duration: "45:30",
      uploadDate: "2024-01-15",
      status: "transcribed",
      corrections: {
        transcription: 12,
        translation: 8
      },
      confidence: 92,
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      user: "Budi Santoso", 
      fileName: "ML_Seminar_Introduction.mp3",
      title: "Machine Learning Seminar",
      duration: "32:15",
      uploadDate: "2024-01-14",
      status: "translated",
      corrections: {
        transcription: 5,
        translation: 15
      },
      confidence: 88,
      timestamp: "4 hours ago"
    },
    {
      id: 3,
      user: "Maya Putri",
      fileName: "React_Native_Workshop.mp4",
      title: "React Native Workshop",
      duration: "1:12:45",
      uploadDate: "2024-01-13",
      status: "transcribed",
      corrections: {
        transcription: 18,
        translation: 0
      },
      confidence: 95,
      timestamp: "1 day ago"
    }
  ];

  const systemStats = [
    { label: "Total Users", value: "1,247", change: "+12%", icon: Users },
    { label: "Projects", value: "89", change: "+8%", icon: FileText },
    { label: "Pending Reviews", value: "23", change: "-5%", icon: AlertTriangle },
    { label: "Quality Score", value: "94.2%", change: "+2.1%", icon: TrendingUp }
  ];

  const handleApprove = (fileId: number) => {
    console.log("Approving file:", fileId);
    // Here you would call API to approve the file corrections
  };

  const handleReject = (fileId: number) => {
    console.log("Rejecting file:", fileId);
    // Here you would call API to reject the file corrections
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === pendingFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(pendingFiles.map(file => file.id));
    }
  };

  const handleSelectFile = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleBulkApprove = () => {
    selectedFiles.forEach(fileId => handleApprove(fileId));
    setSelectedFiles([]);
  };

  const handleBulkReject = () => {
    selectedFiles.forEach(fileId => handleReject(fileId));
    setSelectedFiles([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage user contributions and system quality</p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-primary/10 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Submitted Audio Files</h2>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{pendingFiles.length} files</Badge>
                {selectedFiles.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkReject}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject ({selectedFiles.length})
                    </Button>
                    <Button 
                      variant="academic" 
                      size="sm"
                      onClick={handleBulkApprove}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve ({selectedFiles.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <Checkbox 
                checked={selectedFiles.length === pendingFiles.length && pendingFiles.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
            
            <div className="space-y-4">
              {pendingFiles.map((file) => (
                <Card key={file.id} className="border-primary/10 bg-gradient-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox 
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={() => handleSelectFile(file.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Upload className="w-4 h-4 text-primary" />
                            <div className="font-medium text-foreground">{file.user}</div>
                            <Badge 
                              variant={file.status === 'transcribed' ? 'default' : 'secondary'}
                              className={file.status === 'transcribed' ? 'bg-blue-500' : 'bg-accent'}
                            >
                              {file.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {file.confidence}% confidence
                            </Badge>
                          </div>
                          
                          <h3 className="font-medium text-foreground mb-2">{file.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{file.fileName}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {file.duration}
                            </div>
                            <div>Uploaded: {file.uploadDate}</div>
                            <div>Corrections: {file.corrections.transcription + file.corrections.translation}</div>
                          </div>
                          
                          <div className="flex gap-2 text-xs">
                            <Badge variant="outline">
                              Transcription: {file.corrections.transcription} edits
                            </Badge>
                            <Badge variant="outline">
                              Translation: {file.corrections.translation} edits
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleReject(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="academic" 
                          size="sm"
                          onClick={() => handleApprove(file.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Approved Contributions</h3>
              <p className="text-muted-foreground">View recently approved user edits and contributions</p>
            </div>
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-4">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Rejected Contributions</h3>
              <p className="text-muted-foreground">Review rejected edits and provide feedback</p>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Transcription Accuracy</span>
                        <span className="text-sm font-medium">94.2%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "94.2%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Translation Quality</span>
                        <span className="text-sm font-medium">89.7%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: "89.7%" }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">User Engagement</span>
                        <span className="text-sm font-medium">87.3%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-academic-teal h-2 rounded-full" style={{ width: "87.3%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Sarah Ahmad</p>
                      <p className="text-sm text-muted-foreground">156 approved edits</p>
                    </div>
                    <Badge className="bg-yellow-500 text-white">Gold</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Budi Santoso</p>
                      <p className="text-sm text-muted-foreground">132 approved edits</p>
                    </div>
                    <Badge className="bg-gray-400 text-white">Silver</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Maya Putri</p>
                      <p className="text-sm text-muted-foreground">98 approved edits</p>
                    </div>
                    <Badge className="bg-orange-500 text-white">Bronze</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;