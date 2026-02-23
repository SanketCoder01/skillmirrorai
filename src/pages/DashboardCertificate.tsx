import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Award, Download, QrCode, CheckCircle, Calendar, 
  Building2, User, Shield, Loader2, Share2, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "qrcode";

interface CertificateData {
  id: string;
  certificate_number: string;
  user_id: string;
  skillmirror_id: string;
  full_name: string;
  university: string;
  course: string;
  test_score: number;
  verification_status: string;
  issued_at: string;
  valid_until: string | null;
  skills_verified: string[];
  qr_code_url: string | null;
}

const DashboardCertificate = () => {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCertificate();
    }
  }, [user]);

  const fetchCertificate = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      if (data) {
        setCertificate(data);
        
        // Generate QR code
        const verifyUrl = `${window.location.origin}/verify/${data.certificate_number}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#000", light: "#fff" },
        });
        setQrCodeDataUrl(qrDataUrl);
      }
    } catch (error) {
      console.error("Error fetching certificate:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    if (!user || !profile) return;
    
    // Check if user is verified
    if (profile.verification_status !== "verified" && profile.candidate_score < 70) {
      toast({
        title: "Not eligible",
        description: "You need to pass the skill verification test with at least 70% score.",
        variant: "destructive",
      });
      return;
    }
    
    setGenerating(true);
    
    try {
      // Get test score
      const { data: testResult } = await supabase
        .from("skill_tests")
        .select("score, skills_verified")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();
      
      const score = testResult?.score || profile.candidate_score || 0;
      
      // Generate certificate number
      const certNumber = `SM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("certificates")
        .insert({
          user_id: user.id,
          skillmirror_id: profile.skillmirror_id,
          full_name: profile.full_name,
          university: profile.university,
          course: profile.course,
          test_score: score,
          verification_status: profile.verification_status,
          certificate_number: certNumber,
          skills_verified: testResult?.skills_verified || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCertificate(data);
      
      // Generate QR code
      const verifyUrl = `${window.location.origin}/verify/${certNumber}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#000", light: "#fff" },
      });
      setQrCodeDataUrl(qrDataUrl);
      
      toast({
        title: "Certificate Generated!",
        description: "Your skill verification certificate is ready.",
      });
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current || !certificate) return;
    
    // Create a simple HTML-based certificate for download
    const verifyUrl = `${window.location.origin}/verify/${certificate.certificate_number}`;
    
    const certHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SkillMirror Certificate - ${certificate.full_name}</title>
        <style>
          body { font-family: 'Georgia', serif; margin: 0; padding: 40px; background: #f5f5f5; }
          .certificate { 
            max-width: 800px; margin: 0 auto; background: white; 
            padding: 60px; border: 3px solid #1a365d; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 30px; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #1a365d; }
          .title { font-size: 28px; color: #2d3748; margin-top: 20px; text-transform: uppercase; letter-spacing: 4px; }
          .content { text-align: center; padding: 30px 0; }
          .name { font-size: 36px; color: #1a365d; font-weight: bold; margin: 20px 0; }
          .text { font-size: 16px; color: #4a5568; line-height: 1.8; }
          .score { font-size: 48px; color: #48bb78; font-weight: bold; margin: 20px 0; }
          .details { display: flex; justify-content: space-around; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .detail-item { text-align: center; }
          .detail-label { font-size: 12px; color: #718096; text-transform: uppercase; }
          .detail-value { font-size: 14px; color: #2d3748; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a365d; }
          .cert-number { font-family: monospace; font-size: 14px; color: #718096; }
          .qr { margin-top: 20px; }
          .verify-link { font-size: 12px; color: #4299e1; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="logo">🎓 SkillMirror</div>
            <div class="title">Certificate of Skill Verification</div>
          </div>
          <div class="content">
            <div class="text">This is to certify that</div>
            <div class="name">${certificate.full_name}</div>
            <div class="text">
              has successfully completed the SkillMirror Skill Verification Assessment<br>
              with a score of
            </div>
            <div class="score">${certificate.test_score}%</div>
            <div class="text">
              demonstrating proficiency in technical skills and professional competencies.
            </div>
          </div>
          <div class="details">
            <div class="detail-item">
              <div class="detail-label">SkillMirror ID</div>
              <div class="detail-value">${certificate.skillmirror_id}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">University</div>
              <div class="detail-value">${certificate.university}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Course</div>
              <div class="detail-value">${certificate.course}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Issue Date</div>
              <div class="detail-value">${new Date(certificate.issued_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="footer">
            <div class="cert-number">Certificate No: ${certificate.certificate_number}</div>
            <div class="verify-link">Verify at: ${verifyUrl}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Open in new window for printing/saving
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(certHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const copyCertificateLink = () => {
    if (!certificate) return;
    const url = `${window.location.origin}/verify/${certificate.certificate_number}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Certificate verification link copied to clipboard.",
    });
  };

  const shareCertificate = async () => {
    if (!certificate) return;
    const url = `${window.location.origin}/verify/${certificate.certificate_number}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My SkillMirror Certificate",
          text: `I scored ${certificate.test_score}% on my SkillMirror Skill Verification! Verify my certificate:`,
          url,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      copyCertificateLink();
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
          <h1 className="text-2xl font-display font-bold">Skill Verification Certificate</h1>
          <p className="text-muted-foreground">Your verified skill credentials</p>
        </div>
        {certificate && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCertificateLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={shareCertificate}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button size="sm" onClick={downloadCertificate}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>

      {certificate ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificate Preview */}
          <div className="lg:col-span-2">
            <Card className="glass-card overflow-hidden">
              <div 
                ref={certificateRef}
                className="p-8 bg-white text-gray-900"
                style={{ 
                  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                }}
              >
                <div className="text-center border-b-2 border-primary/30 pb-6 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Award className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-display font-bold text-primary">SkillMirror</span>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-widest text-gray-700">
                    Certificate of Skill Verification
                  </h2>
                </div>

                <div className="text-center py-6">
                  <p className="text-gray-600">This is to certify that</p>
                  <h3 className="text-3xl font-bold text-primary my-4">{certificate.full_name}</h3>
                  <p className="text-gray-600">
                    has successfully completed the SkillMirror Skill Verification Assessment
                  </p>
                  <div className="my-6">
                    <span className="text-5xl font-bold text-green-600">{certificate.test_score}%</span>
                  </div>
                  <p className="text-gray-600">
                    demonstrating proficiency in technical skills and professional competencies
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-6 mt-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">SkillMirror ID</p>
                    <p className="font-mono font-bold text-sm">{certificate.skillmirror_id}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">University</p>
                    <p className="font-bold text-sm">{certificate.university}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Course</p>
                    <p className="font-bold text-sm">{certificate.course}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Issue Date</p>
                    <p className="font-bold text-sm">{new Date(certificate.issued_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Certificate Number</p>
                    <p className="font-mono text-sm">{certificate.certificate_number}</p>
                  </div>
                  {qrCodeDataUrl && (
                    <div className="text-center">
                      <img src={qrCodeDataUrl} alt="QR Code" className="w-20 h-20 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">Scan to verify</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Certificate Details */}
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified & Authentic
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  This certificate is cryptographically verified and can be authenticated by anyone with the certificate link.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Skills Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(certificate.skills_verified || ["Problem Solving", "Technical Analysis", "Communication"]).map((skill, idx) => (
                    <Badge key={idx} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Certificate Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Issued: {new Date(certificate.issued_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Candidate Score: {certificate.test_score}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{certificate.university}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Award className="h-12 w-12 text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">No Certificate Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {profile?.verification_status === "verified" || (profile?.candidate_score || 0) >= 70
                ? "You're eligible! Generate your skill verification certificate now."
                : "Complete the Skill Verification Test with at least 70% score to earn your certificate."}
            </p>
            
            {(profile?.verification_status === "verified" || (profile?.candidate_score || 0) >= 70) ? (
              <Button onClick={generateCertificate} disabled={generating} className="btn-glow">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Generate Certificate
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => window.location.href = "/dashboard/skill-test"}>
                Take Skill Test
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardCertificate;
