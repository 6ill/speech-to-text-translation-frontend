import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, FileText, Languages, Play } from "lucide-react";

interface ProjectCardProps {
  title: string;
  duration: string;
  transcriptionProgress: number;
  translationProgress: number;
  contributors: number;
  status: "transcribing" | "translating" | "completed" | "reviewing";
  lastUpdated: string;
}

const ProjectCard = ({ 
  title, 
  duration, 
  transcriptionProgress, 
  translationProgress, 
  contributors, 
  status,
  lastUpdated 
}: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "transcribing": return "bg-blue-500";
      case "translating": return "bg-accent";
      case "completed": return "bg-green-500";
      case "reviewing": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "transcribing": return "Transcribing";
      case "translating": return "Translating";
      case "completed": return "Completed";
      case "reviewing": return "Under Review";
      default: return "Unknown";
    }
  };

  return (
    <Card className="hover:shadow-elegant transition-smooth border-primary/10 bg-gradient-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg text-foreground line-clamp-2">{title}</CardTitle>
          <Badge className={`${getStatusColor(status)} text-white border-0`}>
            {getStatusText(status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{contributors} contributors</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Transcription
              </span>
              <span className="text-sm font-medium">{transcriptionProgress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-smooth" 
                style={{ width: `${transcriptionProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground flex items-center">
                <Languages className="w-4 h-4 mr-1" />
                Translation
              </span>
              <span className="text-sm font-medium">{translationProgress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-smooth" 
                style={{ width: `${translationProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </CardContent>
      
      <CardFooter className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Play className="w-4 h-4" />
          Preview
        </Button>
        <Button variant="default" size="sm" className="flex-1">
          Continue Editing
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;