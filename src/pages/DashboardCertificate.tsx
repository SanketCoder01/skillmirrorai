import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Award, Upload, Trash2, Calendar, Building2, FileText, Loader2, Image, X,
  Download, ZoomIn, FileImage, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserCertificate {
  id: string;
  user_id: string;
  certificate_name: string;
  issuing_company: string;
  issue_date: string;
  certificate_image_url: string | null;
  created_at: string;
}

const DashboardCertificate = () => {
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    certificate_name: "",
    issuing_company: "",
    issue_date: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewCertificate, setViewCertificate] = useState<UserCertificate | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("user_certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum size is 5MB", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.certificate_name || !formData.issuing_company || !formData.issue_date) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("user-certificates")
          .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("user-certificates")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Insert certificate record
      const { error: insertError } = await supabase
        .from("user_certificates")
        .insert({
          user_id: user.id,
          certificate_name: formData.certificate_name,
          issuing_company: formData.issuing_company,
          issue_date: formData.issue_date,
          certificate_image_url: imageUrl,
        });

      if (insertError) throw insertError;

      toast({ title: "Certificate uploaded!", description: "Your certificate has been added successfully." });
      
      // Reset form
      setFormData({ certificate_name: "", issuing_company: "", issue_date: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowForm(false);
      
      fetchCertificates();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (cert: UserCertificate) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;

    try {
      // Delete image from storage if exists
      if (cert.certificate_image_url) {
        const path = cert.certificate_image_url.split("/user-certificates/")[1];
        if (path) {
          await supabase.storage.from("user-certificates").remove([path]);
        }
      }

      // Delete record
      const { error } = await supabase
        .from("user_certificates")
        .delete()
        .eq("id", cert.id);

      if (error) throw error;

      toast({ title: "Certificate deleted" });
      fetchCertificates();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  // Download as JPG (original image)
  const downloadAsJpg = async (cert: UserCertificate) => {
    if (!cert.certificate_image_url) {
      toast({ title: "No image available", description: "This certificate has no image to download", variant: "destructive" });
      return;
    }

    setDownloading(true);
    try {
      const response = await fetch(cert.certificate_image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cert.certificate_name.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded as JPG" });
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  // Download as PDF (convert image to PDF)
  const downloadAsPdf = async (cert: UserCertificate) => {
    if (!cert.certificate_image_url) {
      toast({ title: "No image available", description: "This certificate has no image to download", variant: "destructive" });
      return;
    }

    setDownloading(true);
    try {
      // Create a canvas to convert image to PDF
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = cert.certificate_image_url;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');
      ctx.drawImage(img, 0, 0);

      // Convert to PDF using data URL
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Create a simple HTML page with the image and print as PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: "Popup blocked", description: "Please allow popups to download PDF", variant: "destructive" });
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${cert.certificate_name}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { display: block; }
                img { width: 100%; height: auto; page-break-after: avoid; }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="${cert.certificate_name}" />
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      toast({ title: "PDF ready to print/save", description: "Use Print dialog to save as PDF" });
    } catch (error) {
      console.error("PDF conversion error:", error);
      toast({ title: "PDF generation failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">My Certificates</h1>
          <p className="text-muted-foreground">Store all your certificates here and download whenever you want</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {showForm ? "Cancel" : "Add Certificate"}
        </Button>
      </div>

      {/* Description Card */}
      <Card className="glass-card border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Certificate Storage</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Upload and securely store all your certificates in one place. Click on any certificate to view it in full size. 
                Download as JPG or PDF format whenever you need to share them.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      {showForm && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Add New Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cert_name">Certificate Name *</Label>
                  <Input
                    id="cert_name"
                    value={formData.certificate_name}
                    onChange={e => setFormData({ ...formData, certificate_name: e.target.value })}
                    placeholder="e.g., AWS Solutions Architect"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Issuing Company *</Label>
                  <Input
                    id="company"
                    value={formData.issuing_company}
                    onChange={e => setFormData({ ...formData, issuing_company: e.target.value })}
                    placeholder="e.g., Amazon Web Services"
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issue_date">Issue Date *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image">Certificate Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max 5MB, images only</p>
                </div>
              </div>
              
              {previewUrl && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-2 border rounded-lg p-2 inline-block">
                    <img src={previewUrl} alt="Preview" className="max-h-48 rounded" />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={uploading} className="w-full md:w-auto">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Award className="h-12 w-12 text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your certificates to showcase your achievements to recruiters.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add Your First Certificate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <Card 
              key={cert.id} 
              className="glass-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setViewCertificate(cert)}
            >
              {cert.certificate_image_url ? (
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative group">
                  <img 
                    src={cert.certificate_image_url} 
                    alt={cert.certificate_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{cert.certificate_name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{cert.issuing_company}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-muted-foreground">Click to view</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cert);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Certificate View Dialog */}
      <Dialog open={!!viewCertificate} onOpenChange={() => setViewCertificate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {viewCertificate?.certificate_name}
            </DialogTitle>
          </DialogHeader>
          
          {viewCertificate && (
            <div className="space-y-4">
              {/* Certificate Image */}
              {viewCertificate.certificate_image_url ? (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={viewCertificate.certificate_image_url} 
                    alt={viewCertificate.certificate_name}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-12 flex flex-col items-center justify-center bg-muted">
                  <FileText className="h-16 w-16 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
              
              {/* Certificate Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Issuing Company</p>
                  <p className="font-medium">{viewCertificate.issuing_company}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{new Date(viewCertificate.issue_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Download Options */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => downloadAsJpg(viewCertificate)}
                  disabled={downloading || !viewCertificate.certificate_image_url}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Download as JPG
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadAsPdf(viewCertificate)}
                  disabled={downloading || !viewCertificate.certificate_image_url}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(viewCertificate);
                    setViewCertificate(null);
                  }}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardCertificate;
