import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProjectCard from "@/components/ProjectCard";
import UploadSection from "@/components/UploadSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Clock, Users, Award, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const recentProjects = [
    {
      title: "Kuliah Algoritma dan Struktur Data - Pertemuan 5",
      duration: "1h 23m",
      status: "translating" as const,
      uploadedDate: "Jan 14, 2025"
    },
    {
      title: "Seminar Machine Learning - Deep Learning Fundamentals",
      duration: "2h 15m",
      status: "translated" as const,
      uploadedDate: "Jan 13, 2025"
    },
    {
      title: "Workshop React Native - Mobile Development",
      duration: "45m",
      status: "transcribing" as const,
      uploadedDate: "Jan 15, 2025"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">12</div>
                  <p className="text-xs text-muted-foreground">+3 from last month</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hours Transcribed</CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">147.5</div>
                  <p className="text-xs text-muted-foreground">+12.3 this week</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contributors</CardTitle>
                  <Users className="h-4 w-4 text-academic-teal" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">89</div>
                  <p className="text-xs text-muted-foreground">+5 new this month</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                  <Award className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">94.2%</div>
                  <p className="text-xs text-muted-foreground">+2.1% improvement</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Translation completed</p>
                        <p className="text-sm text-muted-foreground">Deep Learning Fundamentals</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">New contributor joined</p>
                        <p className="text-sm text-muted-foreground">Algoritma dan Struktur Data</p>
                      </div>
                      <span className="text-xs text-muted-foreground">4h ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Transcription improved</p>
                        <p className="text-sm text-muted-foreground">Mobile Development Workshop</p>
                      </div>
                      <span className="text-xs text-muted-foreground">1d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Community Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                        <div>
                          <p className="font-medium text-foreground">Sarah Ahmad</p>
                          <p className="text-sm text-muted-foreground">2,340 points</p>
                        </div>
                      </div>
                      <Award className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                        <div>
                          <p className="font-medium text-foreground">Budi Santoso</p>
                          <p className="text-sm text-muted-foreground">1,890 points</p>
                        </div>
                      </div>
                      <Award className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                        <div>
                          <p className="font-medium text-foreground">Maya Putri</p>
                          <p className="text-sm text-muted-foreground">1,675 points</p>
                        </div>
                      </div>
                      <Award className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">My Projects</h2>
              <Button variant="academic">Create New Project</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project, index) => (
                <ProjectCard key={index} {...project} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="upload">
            <UploadSection />
          </TabsContent>
          
          <TabsContent value="community" className="space-y-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Community Projects</h2>
              <p className="text-muted-foreground mb-8">Explore and contribute to projects from other users</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentProjects.map((project, index) => (
                  <ProjectCard key={index} {...project} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;