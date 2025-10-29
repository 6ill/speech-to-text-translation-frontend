import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Check } from "lucide-react";

interface TimestampSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  originalText?: string;
  isEdited?: boolean;
  editedBy?: string;
  confidence?: number;
}

interface TimestampEditorProps {
  segments: TimestampSegment[];
  onSegmentEdit: (segmentId: string, newText: string) => void;
  currentTime: number;
  type: 'transcription' | 'translation';
}

const TimestampEditor = ({ segments, onSegmentEdit, currentTime, type }: TimestampEditorProps) => {
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEdit = (segment: TimestampSegment) => {
    setEditingSegment(segment.id);
    setEditText(segment.text);
  };

  const handleSave = (segmentId: string) => {
    onSegmentEdit(segmentId, editText);
    setEditingSegment(null);
    setEditText("");
  };

  const handleCancel = () => {
    setEditingSegment(null);
    setEditText("");
  };

  const isCurrentSegment = (segment: TimestampSegment) => {
    return currentTime >= segment.startTime && currentTime <= segment.endTime;
  };

  return (
    <div className="space-y-3">
      {segments.map((segment) => {
        const isEditing = editingSegment === segment.id;
        const isCurrent = isCurrentSegment(segment);
        
        return (
          <Card 
            key={segment.id} 
            className={`border transition-smooth ${
              isCurrent 
                ? 'border-primary bg-primary/5' 
                : segment.isEdited 
                ? 'border-academic-teal/50 bg-academic-teal/5'
                : 'border-border'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                  </Badge>
                  {isCurrent && (
                    <Badge className="text-xs bg-primary text-white">
                      Playing
                    </Badge>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button variant="academic" size="sm" onClick={() => handleSave(segment.id)}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(segment)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px] text-sm border-primary/20 focus:border-primary"
                  placeholder={`Edit ${type} here...`}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-foreground">
                    {segment.text}
                  </p>
                  {segment.originalText && segment.originalText !== segment.text && (
                    <div className="p-2 bg-muted rounded text-xs">
                      <span className="text-muted-foreground">Original: </span>
                      <span className="line-through">{segment.originalText}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TimestampEditor;