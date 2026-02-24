import { useState } from "react";
import { Search, Filter, BookOpen, MapPin, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupportItem {
  code: string;
  name: string;
  category: string;
  unit: string;
  nationalPrice: string;
  remotePrice: string;
  veryRemotePrice: string;
  claimTypes: string[];
  effectiveFrom: string;
}

const supportItems: SupportItem[] = [
  { code: "01_011_0107_1_1", name: "Assistance With Self-Care Activities - Standard - Weekday Daytime", category: "Assistance with Daily Life", unit: "Hour", nationalPrice: "$67.56", remotePrice: "$94.58", veryRemotePrice: "$101.34", claimTypes: ["Standard", "TTP"], effectiveFrom: "01 Jul 2025" },
  { code: "01_011_0107_1_1_T", name: "Assistance With Self-Care Activities - Standard - Weekday Evening", category: "Assistance with Daily Life", unit: "Hour", nationalPrice: "$74.38", remotePrice: "$104.13", veryRemotePrice: "$111.57", claimTypes: ["Standard"], effectiveFrom: "01 Jul 2025" },
  { code: "01_002_0107_1_1", name: "Assistance With Self-Care Activities - Level 2 - Weekday Daytime", category: "Assistance with Daily Life", unit: "Hour", nationalPrice: "$70.43", remotePrice: "$98.60", veryRemotePrice: "$105.65", claimTypes: ["Standard", "TTP"], effectiveFrom: "01 Jul 2025" },
  { code: "04_104_0125_6_1", name: "Assessment, Recommendation, Therapy and/or Training (incl. AT) - Physiotherapist", category: "Improved Daily Living", unit: "Hour", nationalPrice: "$193.99", remotePrice: "$271.59", veryRemotePrice: "$290.99", claimTypes: ["Standard", "Non-F2F", "Travel"], effectiveFrom: "01 Jul 2025" },
  { code: "04_105_0125_6_1", name: "Assessment, Recommendation, Therapy and/or Training (incl. AT) - Occupational Therapist", category: "Improved Daily Living", unit: "Hour", nationalPrice: "$193.99", remotePrice: "$271.59", veryRemotePrice: "$290.99", claimTypes: ["Standard", "Non-F2F", "Travel"], effectiveFrom: "01 Jul 2025" },
  { code: "04_106_0125_6_1", name: "Assessment, Recommendation, Therapy and/or Training (incl. AT) - Speech Pathologist", category: "Improved Daily Living", unit: "Hour", nationalPrice: "$193.99", remotePrice: "$271.59", veryRemotePrice: "$290.99", claimTypes: ["Standard", "Non-F2F", "Travel"], effectiveFrom: "01 Jul 2025" },
  { code: "07_001_0106_6_3", name: "Support Coordination", category: "Support Coordination", unit: "Hour", nationalPrice: "$100.14", remotePrice: "$140.20", veryRemotePrice: "$150.21", claimTypes: ["Standard", "Non-F2F"], effectiveFrom: "01 Jul 2025" },
  { code: "07_002_0106_6_3", name: "Specialist Support Coordination", category: "Support Coordination", unit: "Hour", nationalPrice: "$190.54", remotePrice: "$266.76", veryRemotePrice: "$285.81", claimTypes: ["Standard", "Non-F2F"], effectiveFrom: "01 Jul 2025" },
  { code: "15_037_0117_1_3", name: "Plan Management - Set Up Costs", category: "Improved Life Choices", unit: "Each", nationalPrice: "$237.36", remotePrice: "$237.36", veryRemotePrice: "$237.36", claimTypes: ["Standard"], effectiveFrom: "01 Jul 2025" },
  { code: "15_038_0117_1_3", name: "Plan Management - Monthly Fee", category: "Improved Life Choices", unit: "Month", nationalPrice: "$104.45", remotePrice: "$104.45", veryRemotePrice: "$104.45", claimTypes: ["Standard"], effectiveFrom: "01 Jul 2025" },
  { code: "15_040_0117_1_3", name: "Plan Management - Claim Processing", category: "Improved Life Choices", unit: "Each", nationalPrice: "$33.43", remotePrice: "$33.43", veryRemotePrice: "$33.43", claimTypes: ["Standard"], effectiveFrom: "01 Jul 2025" },
  { code: "03_010_0104_1_1", name: "Community Nursing Care", category: "Assistance with Daily Life", unit: "Hour", nationalPrice: "$107.25", remotePrice: "$150.15", veryRemotePrice: "$160.88", claimTypes: ["Standard", "Non-F2F", "Travel"], effectiveFrom: "01 Jul 2025" },
];

const categories = [...new Set(supportItems.map((i) => i.category))];

export default function PriceGuide() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const filtered = selectedCategory === "all" ? supportItems : supportItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">NDIA Price Guide</h1>
          <p className="mt-1 text-sm text-muted-foreground">NDIS Pricing Arrangements and Price Limits — support catalogue with regional modifiers</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Effective: 1 Jul 2025 – 30 Jun 2026</span>
          <Badge variant="outline" className="ml-1 text-[11px] bg-success/10 text-success border-success/20">Current</Badge>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <BookOpen className="h-4 w-4 text-accent" />
        <p className="text-xs text-muted-foreground">
          Prices shown are maximum price limits. Regional/remote modifiers apply the <span className="font-medium text-card-foreground">Modified Monash Model (MMM)</span> classifications. Prices are GST-exclusive for registered providers.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search by item code or name..." className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <MapPin className="h-3.5 w-3.5" />
          Location
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Support Item</th>
                <th className="px-5 py-2.5 text-left font-medium">Category</th>
                <th className="px-5 py-2.5 text-left font-medium">Unit</th>
                <th className="px-5 py-2.5 text-right font-medium">National</th>
                <th className="px-5 py-2.5 text-right font-medium">Remote</th>
                <th className="px-5 py-2.5 text-right font-medium">Very Remote</th>
                <th className="px-5 py-2.5 text-left font-medium">Claim Types</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.code} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <p className="font-medium text-card-foreground text-xs leading-relaxed">{item.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{item.code}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{item.category}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{item.unit}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs font-medium text-card-foreground">{item.nationalPrice}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">{item.remotePrice}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">{item.veryRemotePrice}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.claimTypes.map((ct) => (
                        <span key={ct} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{ct}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {supportItems.length} items · Source: NDIS Pricing Arrangements and Price Limits (PAPL) 2025–26
      </p>
    </div>
  );
}
