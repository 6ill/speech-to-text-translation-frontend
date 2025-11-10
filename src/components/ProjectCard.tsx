import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Play } from "lucide-react";

interface ProjectCardProps {
  title: string;
  duration: string;
  status: "transcribing" | "transcribed" | "translating" | "translated";
  uploadedDate: string;
}

const ProjectCard = ({ 
  title, 
  duration, 
  status,
  uploadedDate 
}: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "transcribing": return "bg-blue-500";
      case "transcribed": return "bg-green-500";
      case "translating": return "bg-accent";
      case "translated": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "transcribing": return "Transcribing";
      case "transcribed": return "Transcribed";
      case "translating": return "Translating";
      case "translated": return "Translated";
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
        </div>
        
        <p className="text-xs text-muted-foreground">
          Uploaded: {uploadedDate}
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