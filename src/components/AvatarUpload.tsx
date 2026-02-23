import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Check, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userName: string;
  onUploadComplete: (url: string) => void;
  refreshProfile?: () => Promise<void>;
  size?: "sm" | "md" | "lg";
}

const AvatarUpload = ({
  currentAvatarUrl,
  userName,
  onUploadComplete,
  refreshProfile,
  size = "md",
}: AvatarUploadProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setCropPosition({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setIsDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
  }, [cropPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const maxX = (container.offsetWidth * (zoom - 1)) / 2;
    const maxY = (container.offsetHeight * (zoom - 1)) / 2;
    
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    // Constrain to bounds
    newX = Math.min(maxX, Math.max(-maxX, newX));
    newY = Math.min(maxY, Math.max(-maxY, newY));
    
    setCropPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedImage || !imageRef.current || !containerRef.current) return;

    setUploading(true);

    try {
      // Create canvas for cropping
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const container = containerRef.current;
      const img = imageRef.current;

      // Set canvas size to circular crop area
      const cropSize = Math.min(container.offsetWidth, container.offsetHeight);
      canvas.width = cropSize;
      canvas.height = cropSize;

      // Calculate source coordinates
      const scaleX = img.naturalWidth / (container.offsetWidth * zoom);
      const scaleY = img.naturalHeight / (container.offsetHeight * zoom);
      
      const sourceX = ((container.offsetWidth / 2) - cropPosition.x - cropSize / (2 * zoom)) * scaleX;
      const sourceY = ((container.offsetHeight / 2) - cropPosition.y - cropSize / (2 * zoom)) * scaleY;
      const sourceWidth = cropSize * scaleX / zoom;
      const sourceHeight = cropSize * scaleY / zoom;

      // Apply rotation
      ctx.translate(cropSize / 2, cropSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-cropSize / 2, -cropSize / 2);

      // Draw circular clip
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        cropSize,
        cropSize
      );

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/jpeg", 0.9);
      });

      // Upload to Supabase Storage
      const fileName = `${Date.now()}_avatar.jpg`;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Refresh profile in AuthContext to update sidebar
      if (refreshProfile) {
        await refreshProfile();
      }

      onUploadComplete(publicUrl);
      setIsDialogOpen(false);
      setSelectedImage(null);
      
      toast({ title: "Avatar updated successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-border cursor-pointer`}>
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Avatar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Crop Area */}
            <div className="flex justify-center">
              <div
                ref={containerRef}
                className="relative w-64 h-64 rounded-full overflow-hidden bg-muted border-2 border-dashed border-border cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {selectedImage && (
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Crop preview"
                    className="absolute"
                    style={{
                      width: `calc(100% * ${zoom})`,
                      height: `calc(100% * ${zoom})`,
                      left: `calc(50% - 50% * ${zoom} + ${cropPosition.x}px)`,
                      top: `calc(50% - 50% * ${zoom} + ${cropPosition.y}px)`,
                      transform: `rotate(${rotation}deg)`,
                      objectFit: "cover",
                    }}
                    draggable={false}
                  />
                )}
                {/* Circular overlay */}
                <div className="absolute inset-0 rounded-full border-4 border-primary pointer-events-none" />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">Zoom:</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-10">{zoom.toFixed(1)}x</span>
              </div>

              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4 mr-1" />
                  Rotate
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedImage(null);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUpload;
