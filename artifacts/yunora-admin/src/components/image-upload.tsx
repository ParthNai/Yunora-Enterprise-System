import { useState } from "react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label = "Image", className }: ImageUploadProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const requestUploadUrl = useRequestUploadUrl();

  const getUploadParameters = async (file: any) => {
    const result = await requestUploadUrl.mutateAsync({
      data: {
        name: file.name,
        size: file.size,
        contentType: file.type,
      },
    });
    const data = result as any;
    return {
      method: "PUT" as const,
      url: data.uploadURL,
      headers: { "Content-Type": file.type },
    };
  };

  const handleComplete = (result: any) => {
    if (result.successful?.length > 0) {
      const file = result.successful[0];
      const uploadResp = file.response?.uploadURL || "";
      const uploadedData = requestUploadUrl.data as any;
      if (uploadedData?.objectPath) {
        onChange(`/api${uploadedData.objectPath}`);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={mode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("url")}
        >
          <Link className="h-3 w-3 mr-1" /> URL
        </Button>
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
        >
          <Upload className="h-3 w-3 mr-1" /> Upload
        </Button>
      </div>

      {mode === "url" ? (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg or /api/storage/objects/..."
        />
      ) : (
        <ObjectUploader
          onGetUploadParameters={getUploadParameters}
          onComplete={handleComplete}
          maxFileSize={20971520}
          buttonClassName="w-full"
        >
          <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/40 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/60 transition-colors w-full">
            <Upload className="h-4 w-4" />
            Click to upload image (max 20MB)
          </div>
        </ObjectUploader>
      )}

      {value && (
        <div className="relative inline-block mt-2">
          <img
            src={value}
            alt="Preview"
            className="h-20 w-20 rounded-md object-cover border border-border"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
