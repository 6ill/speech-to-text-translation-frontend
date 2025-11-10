import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const BrowseProjects = () => {
  // Sample data - replace with actual data fetching
  const projects = [
    {
      title: "Biology Lecture - Cell Structure",
      duration: "45:32",
      contributors: 12,
      status: "translated" as const,
      lastUpdated: "2 hours ago",
    },
    {
      title: "Math Class - Linear Algebra",
      duration: "38:15",
      contributors: 8,
      status: "translating" as const,
      lastUpdated: "5 hours ago",
    },
    {
      title: "History Lesson - Indonesian Independence",
      duration: "52:18",
      contributors: 15,
      status: "transcribing" as const,
      lastUpdated: "1 day ago",
    },
    {
      title: "Chemistry Lab - Organic Compounds",
      duration: "41:27",
      contributors: 10,
      status: "translated" as const,
      lastUpdated: "3 days ago",
    },
    {
      title: "Physics Class - Quantum Mechanics",
      duration: "47:55",
      contributors: 6,
      status: "transcribing" as const,
      lastUpdated: "1 week ago",
    },
    {
      title: "English Literature - Shakespeare",
      duration: "36:42",
      contributors: 9,
      status: "transcribed" as const,
      lastUpdated: "2 weeks ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Projects</h1>
          <p className="text-muted-foreground">Explore and contribute to community projects</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default BrowseProjects;
