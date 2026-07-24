import { AlertTriangle, AlertCircle, Info, Lightbulb } from "lucide-react";

interface DiagnosticBannerProps {
  totalApplications: number;
  interviewYield: number;
  ghostRate: number;
}

export function DiagnosticBanner({ totalApplications, interviewYield, ghostRate }: DiagnosticBannerProps) {
  let severity: "critical" | "warning" | "info" | "success" = "info";
  let title = "";
  let description = "";

  if (totalApplications > 100 && interviewYield < 2) {
    severity = "critical";
    title = "High Volume, Critical Yield Drop";
    description = `You have submitted ${totalApplications} applications with only a ${interviewYield.toFixed(2)}% interview rate. This is critically below the 2-5% benchmark. This strongly indicates your resume is failing ATS filters or you are applying to misaligned roles. Recommendation: Pause applying immediately and rewrite your resume.`;
  } else if (totalApplications > 50 && ghostRate > 70) {
    severity = "warning";
    title = "High Ghosting Rate Detected";
    description = `Your ghosting rate is ${ghostRate.toFixed(0)}%. While ghosting is common, extreme rates suggest your applications are being filtered out before a human sees them. Ensure your resume contains exact keyword matches from the job descriptions.`;
  } else if (totalApplications < 20) {
    severity = "info";
    title = "Building Momentum";
    description = "You're just getting started. Keep applying and tracking to generate meaningful analytics.";
  } else if (interviewYield > 5) {
    severity = "success";
    title = "Excellent Conversion Rate";
    description = `Your interview yield is ${interviewYield.toFixed(1)}%, which is well above average. Your resume and targeting strategy are highly effective. Focus on interview preparation to close the offers.`;
  } else {
    severity = "info";
    title = "Consistent Pipeline";
    description = "Your application metrics are within normal ranges. Keep optimizing your resume for specific roles to improve your yield.";
  }

  const iconMap = {
    critical: <AlertTriangle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-orange-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    success: <Lightbulb className="h-5 w-5 text-emerald-500" />
  };

  const bgMap = {
    critical: "bg-red-500/10 border-red-500/20",
    warning: "bg-orange-500/10 border-orange-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
    success: "bg-emerald-500/10 border-emerald-500/20"
  };

  const textMap = {
    critical: "text-red-500",
    warning: "text-orange-500",
    info: "text-blue-500",
    success: "text-emerald-500"
  };

  return (
    <div className={`col-span-full flex items-start gap-4 p-5 rounded-xl border ${bgMap[severity]}`}>
      <div className="shrink-0 mt-0.5">
        {iconMap[severity]}
      </div>
      <div className="flex flex-col gap-1">
        <h4 className={`text-sm font-semibold tracking-tight ${textMap[severity]}`}>Diagnostic Insight: {title}</h4>
        <p className="text-sm text-foreground/80 leading-relaxed max-w-[900px]">
          {description}
        </p>
      </div>
    </div>
  );
}
