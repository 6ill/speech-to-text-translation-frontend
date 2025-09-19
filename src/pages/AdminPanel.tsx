import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, AlertTriangle, Users, FileText, TrendingUp } from "lucide-react";

const AdminPanel = () => {
  const pendingEdits = [
    {
      id: 1,
      user: "Sarah Ahmad",
      project: "Kuliah Algoritma - Pertemuan 5",
      type: "transcription",
      changes: "Fixed pronunciation of 'algoritma' → 'algorithm'",
      confidence: 92,
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      user: "Budi Santoso", 
      project: "Machine Learning Seminar",
      type: "translation",
      changes: "Improved technical term translation: 'pembelajaran mesin' → 'machine learning'",
      confidence: 88,
      timestamp: "4 hours ago"
    },
    {
      id: 3,
      user: "Maya Putri",
      project: "React Native Workshop",
      type: "transcription", 
      changes: "Corrected speaker identification and timing",
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

  const handleApprove = (editId: number) => {
    console.log("Approving edit:", editId);
    // Here you would call API to approve the edit
  };

  const handleReject = (editId: number) => {
    console.log("Rejecting edit:", editId);
    // Here you would call API to reject the edit
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Pending User Contributions</h2>
              <Badge variant="secondary">{pendingEdits.length} items</Badge>
            </div>
            
            <div className="space-y-4">
              {pendingEdits.map((edit) => (
                <Card key={edit.id} className="border-primary/10 bg-gradient-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="font-medium text-foreground">{edit.user}</div>
                          <Badge 
                            variant={edit.type === 'transcription' ? 'default' : 'secondary'}
                            className={edit.type === 'transcription' ? 'bg-blue-500' : 'bg-accent'}
                          >
                            {edit.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {edit.confidence}% confidence
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium text-foreground mb-2">{edit.project}</h3>
                        <p className="text-muted-foreground mb-3">{edit.changes}</p>
                        <p className="text-xs text-muted-foreground">{edit.timestamp}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                          Review
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