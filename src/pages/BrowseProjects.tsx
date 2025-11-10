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
      status: "translated" as const,
      uploadedDate: "Jan 15, 2025",
    },
    {
      title: "Math Class - Linear Algebra",
      duration: "38:15",
      status: "translating" as const,
      uploadedDate: "Jan 14, 2025",
    },
    {
      title: "History Lesson - Indonesian Independence",
      duration: "52:18",
      status: "transcribing" as const,
      uploadedDate: "Jan 13, 2025",
    },
    {
      title: "Chemistry Lab - Organic Compounds",
      duration: "41:27",
      status: "translated" as const,
      uploadedDate: "Jan 10, 2025",
    },
    {
      title: "Physics Class - Quantum Mechanics",
      duration: "47:55",
      status: "transcribing" as const,
      uploadedDate: "Jan 8, 2025",
    },
    {
      title: "English Literature - Shakespeare",
      duration: "36:42",
      status: "transcribed" as const,
      uploadedDate: "Jan 5, 2025",
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
