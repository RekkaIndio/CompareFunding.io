import React, { useMemo, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Hash,
  MapPin,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import OverviewTab from "./OverviewTab";
import NegativeInformationTab from "./NegativeInformationTab";
import RiskFactorsTab from "./RiskFactorsTab";
import { sampleCreditReport, sampleCompany } from "./sampleCreditData";

type ScoreTheme = {
  label: string;
  badgeClass: string;
  textClass: string;
  accentClass: string;
  haloGradient: string;
  gaugeColor: string;
  barGradient: string;
};

type MetricConfig = {
  title: string;
  value: string;
  helper: string;
  tone: "emerald" | "blue" | "violet";
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
};

type CompanySnapshotItem = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
};

type DataSourceItem = {
  label: string;
  value: string;
};

type ScoreTrendPoint = {
  label: string;
  value: number;
};

const formatCurrency = (value: number) => `£${value.toLocaleString("en-GB")}`;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getScoreTheme = (score: number): ScoreTheme => {
  if (score >= 80) {
    return {
      label: "Excellent",
      badgeClass: "bg-emerald-500 text-white",
      textClass: "text-emerald-800",
      accentClass: "text-emerald-600",
      haloGradient: "from-emerald-400/35 via-teal-400/20 to-sky-400/10",
      gaugeColor: "rgba(16,185,129,0.85)",
      barGradient: "from-emerald-400 to-teal-500",
    };
  }

  if (score >= 70) {
    return {
      label: "Good",
      badgeClass: "bg-blue-500 text-white",
      textClass: "text-blue-900",
      accentClass: "text-blue-600",
      haloGradient: "from-blue-500/35 via-indigo-500/20 to-purple-400/10",
      gaugeColor: "rgba(59,130,246,0.85)",
      barGradient: "from-blue-500 to-indigo-500",
    };
  }

  if (score >= 50) {
    return {
      label: "Fair",
      badgeClass: "bg-amber-500 text-white",
      textClass: "text-amber-900",
      accentClass: "text-amber-600",
      haloGradient: "from-amber-400/35 via-orange-400/20 to-rose-400/10",
      gaugeColor: "rgba(245,158,11,0.85)",
      barGradient: "from-amber-400 to-orange-500",
    };
  }

  return {
    label: "Poor",
    badgeClass: "bg-rose-500 text-white",
    textClass: "text-rose-900",
    accentClass: "text-rose-600",
    haloGradient: "from-rose-500/35 via-rose-400/20 to-purple-400/10",
    gaugeColor: "rgba(239,68,68,0.85)",
    barGradient: "from-rose-400 to-rose-600",
  };
};

const CreditScorePage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSampleData] = useState(true);

  const creditReport = sampleCreditReport;
  const selectedCompany = sampleCompany;

  const creditScore = 75;
  const scoreTheme = useMemo(() => getScoreTheme(creditScore), [creditScore]);
  const currentRating = creditReport.report.creditScore.currentCreditRating;
  const previousRating = creditReport.report.creditScore.previousCreditRating;
  const commentary =
    creditReport.report.creditScore.commentary ??
    "Consistent revenue growth and disciplined cost management underpin a resilient credit position.";

  const scoreTrendData: ScoreTrendPoint[] = [
    { label: "Jun", value: 68 },
    { label: "Jul", value: 70 },
    { label: "Aug", value: 72 },
    { label: "Sep", value: 73 },
    { label: "Oct", value: 74 },
    { label: "Nov", value: 75 },
  ];

  const latestScore = scoreTrendData[scoreTrendData.length - 1]?.value ?? creditScore;
  const previousScore = scoreTrendData[scoreTrendData.length - 2]?.value ?? latestScore;
  const scoreDelta = latestScore - previousScore;
  const scoreDeltaLabel = `${scoreDelta >= 0 ? "+" : ""}${scoreDelta.toFixed(0)} pts vs last month`;

  const maxTrendValue = Math.max(...scoreTrendData.map((point) => point.value));
  const gaugeProgress = Math.min(1, Math.max(0, creditScore / 100));

  const riskSignals = [
    {
      label: "Cashflow coverage",
      value: "1.6x",
      detail: "Operating cash covers near-term obligations 1.6 times.",
      icon: Activity,
      tone: "emerald" as const,
    },
    {
      label: "Borrowing trend",
      value: "41% leverage",
      detail: "Debt-to-turnover ratio has remained stable for 12 months.",
      icon: BarChart3,
      tone: "blue" as const,
    },
    {
      label: "Filing status",
      value: "All up to date",
      detail: "Latest statutory accounts filed on schedule with Companies House.",
      icon: Shield,
      tone: "slate" as const,
    },
  ];

  const highlightMetrics: MetricConfig[] = [
    {
      title: "Credit utilisation",
      value: "32%",
      helper: `of ${formatCurrency(currentRating.creditLimit?.value ?? 50000)} facility`,
      tone: "emerald",
      icon: Zap,
      trend: "Operating comfortably below the 40% target",
    },
    {
      title: "Payment reliability",
      value: "98%",
      helper: "Invoices paid on time in the last 12 months",
      tone: "blue",
      icon: Shield,
      trend: "Improved 4% year on year",
    },
    {
      title: "Industry percentile",
      value: "Top 15%",
      helper: "Compared with UK technology peers",
      tone: "violet",
      icon: TrendingUp,
      trend: "Holding a strong position vs sector median",
    },
  ];

  const companyInfo = creditReport.report.companyIdentification?.basicInformation;

  const companySnapshot: CompanySnapshotItem[] = [
    {
      label: "Registered number",
      value: companyInfo?.companyRegistrationNumber ?? selectedCompany.registrationNumber ?? "—",
      icon: Hash,
    },
    {
      label: "Incorporated",
      value: formatDate(companyInfo?.companyRegistrationDate),
      icon: Calendar,
    },
    {
      label: "Legal form",
      value: companyInfo?.legalForm?.description ?? "Private Limited Company",
      icon: FileText,
    },
    {
      label: "Registered address",
      value:
        creditReport.report.contactInformation?.mainAddress?.simpleValue ??
        companyInfo?.contactAddress?.simpleValue ??
        "Address not available",
      icon: MapPin,
    },
  ];

  const reportSnapshot: { label: string; value: string }[] = [
    {
      label: "Credit rating",
      value: `${currentRating.commonValue ?? "—"} · ${currentRating.commonDescription ?? scoreTheme.label}`,
    },
    {
      label: "Credit limit",
      value: formatCurrency(currentRating.creditLimit?.value ?? 0),
    },
    {
      label: "Previous rating",
      value: previousRating?.commonValue ?? "Stable",
    },
    {
      label: "Latest bureau update",
      value: formatDate(creditReport.report.creditScore.latestRatingChangeDate),
    },
  ];

  const dataSources: DataSourceItem[] = [
    { label: "Latest filed accounts", value: "FY 2023 · filed 12 Sep 2024" },
    { label: "Bank transaction feed", value: "Connected · refreshed weekly" },
    {
      label: "Credit bureau sync",
      value:
        formatDate(creditReport.report.creditScore.latestRatingChangeDate) !== "—"
          ? `Updated ${formatDate(creditReport.report.creditScore.latestRatingChangeDate)}`
          : "Awaiting next bureau update",
    },
  ];

  const recommendedActions = [
    {
      title: "Review credit limit with lenders",
      detail: "Low utilisation and strong metrics support negotiating a higher ceiling in Q1.",
    },
    {
      title: "Upload latest management accounts",
      detail: "Fresh financials keep bureau data aligned with trading performance.",
    },
    {
      title: "Maintain supplier payment cadence",
      detail: "Continue 30-day terms to protect payment reliability metrics.",
    },
  ];

  const negativeInfo = creditReport.report.negativeInformation;
  const hasNegativeInfo = Boolean(
    negativeInfo?.hasNegativeInfo || creditReport.report.additionalInformation?.negativeInformation?.hasNegativeInfo
  );

  return (
    <PageLayout showSidebar>
      <div className="min-h-screen bg-slate-950/5">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0">
            <div className={`absolute -top-40 right-[-160px] w-[520px] h-[520px] rounded-full bg-gradient-to-br ${scoreTheme.haloGradient} opacity-40 blur-3xl`} />
            <div className="absolute bottom-[-260px] left-1/2 -translate-x-1/2 w-[720px] h-[720px] bg-gradient-to-tr from-white/5 via-blue-500/10 to-transparent opacity-40 blur-3xl" />
          </div>

          <div className="relative max-w-[1480px] mx-auto px-4 sm:px-8 lg:px-12 py-20">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Credit insight</p>
                  <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
                    {selectedCompany.name ?? "Business credit report"}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      {companyInfo?.companyStatus?.description ?? selectedCompany.status ?? "Active"}
                    </Badge>
                    {selectedCompany.registrationNumber && (
                      <Badge className="bg-white/10 border border-white/20 text-white/90">
                        Company No. {selectedCompany.registrationNumber}
                      </Badge>
                    )}
                    {isSampleData && (
                      <Badge className="bg-amber-400/20 border border-amber-300/40 text-amber-100">
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        Sample dataset
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 h-11">
                  <Download className="w-4 h-4 mr-2" />
                  Export report
                </Button>
                <Button className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-semibold px-6 h-11">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh data
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Score + Insights */}
        <section className="relative -mt-16 pb-16">
          <div className="max-w-[1480px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
            <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
              <div className="space-y-8">
                <Card className="border border-slate-200/80 backdrop-blur-sm rounded-3xl shadow-[0_28px_80px_-45px_rgba(15,23,42,0.35)]">
                  <div className="grid gap-10 p-8 lg:p-12 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${scoreTheme.accentClass}`}>
                        Credit score
                      </p>

                      <div className="mt-6 flex flex-col items-center">
                        <div className="relative w-56 h-56">
                          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${scoreTheme.haloGradient} blur-3xl`} />
                          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-2xl">
                            <div className="absolute inset-4 rounded-full bg-slate-50 flex flex-col items-center justify-center text-center">
                              <span className={`text-6xl font-black ${scoreTheme.textClass}`}>{creditScore}</span>
                              <span className="mt-1 text-sm font-semibold text-slate-400 tracking-[0.35em]">
                                /100
                              </span>
                              <Badge className={`${scoreTheme.badgeClass} mt-4 px-4 py-1.5 text-sm`}>{scoreTheme.label}</Badge>
                            </div>
                            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200">
                              <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                              <circle
                                cx="100"
                                cy="100"
                                r="90"
                                fill="none"
                                stroke={scoreTheme.gaugeColor}
                                strokeWidth="12"
                                strokeDasharray={`${gaugeProgress * 565} 565`}
                                strokeLinecap="round"
                                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s ease" }}
                              />
                            </svg>
                          </div>
                        </div>

                        <p className="mt-6 text-sm text-slate-500 text-center max-w-sm">{commentary}</p>
                        <p className={`mt-3 text-sm font-semibold ${scoreDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {scoreDeltaLabel}
                        </p>
                      </div>

                      <div className="mt-10">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Score trajectory</p>
                          <span className="text-xs text-slate-400">Last six months</span>
                        </div>
                        <div className="mt-4 flex h-36 items-end gap-4">
                          {scoreTrendData.map((point) => (
                            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                              <div
                                className={`w-full rounded-t-2xl bg-gradient-to-b ${scoreTheme.barGradient}`}
                                style={{ height: `${(point.value / maxTrendValue) * 100}%`, minHeight: "18px" }}
                              />
                              <span className="text-xs font-medium text-slate-500">{point.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Rating summary</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900">
                          {currentRating.commonValue ?? "—"} · {currentRating.commonDescription ?? scoreTheme.label}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {previousRating?.commonValue
                            ? `Previously rated ${previousRating.commonValue} last quarter.`
                            : "Stable rating this quarter."}
                        </p>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Industry avg</span>
                            <p className="mt-1 text-lg font-semibold text-slate-900">62</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peer percentile</span>
                            <p className="mt-1 text-lg font-semibold text-slate-900">Top 15%</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {highlightMetrics.map((metric) => {
                          const Icon = metric.icon;
                          return (
                            <div
                              key={metric.title}
                              className={`rounded-2xl border bg-gradient-to-br p-5 ${
                                metric.tone === "emerald"
                                  ? "from-emerald-50 via-emerald-50/70 to-white border-emerald-100 text-emerald-700"
                                  : metric.tone === "blue"
                                  ? "from-blue-50 via-blue-50/70 to-white border-blue-100 text-blue-700"
                                  : "from-violet-50 via-violet-50/70 to-white border-violet-100 text-violet-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em]">{metric.title}</p>
                                <span className="rounded-xl bg-white/70 p-2">
                                  <Icon className="h-4 w-4" />
                                </span>
                              </div>
                              <p className="mt-4 text-2xl font-semibold text-slate-900">{metric.value}</p>
                              <p className="mt-2 text-sm text-slate-600">{metric.helper}</p>
                              <p className="mt-4 text-xs font-semibold">{metric.trend}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 border-b border-slate-200/70 px-6 py-4">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Risk signals</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {riskSignals.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-start gap-4 px-6 py-4">
                            <div className="rounded-xl bg-slate-100 p-2">
                              <Icon className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                              <p className="text-xs font-semibold text-slate-500">{item.value}</p>
                              <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 border-b border-slate-200/70 px-6 py-4">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Company snapshot</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {companySnapshot.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-start gap-4 px-6 py-4">
                            <div className="rounded-xl bg-slate-100 p-2">
                              <Icon className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200/70 px-6 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Report snapshot</p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {reportSnapshot.map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-6 py-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 border-b border-slate-200/70 px-6 py-4">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Recommended actions</p>
                  </div>
                  <div className="space-y-4 px-6 py-6">
                    {recommendedActions.map((action) => (
                      <div key={action.title} className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{action.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-200 bg-slate-950 text-white">
                  <div className="px-6 py-4 border-b border-white/10">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Data confidence</p>
                  </div>
                  <div className="px-6 py-6 space-y-4">
                    {dataSources.map((source) => (
                      <div key={source.label} className="flex items-start gap-3">
                        <ArrowUpRight className="mt-1 h-4 w-4 text-blue-300" />
                        <div>
                          <p className="text-sm font-semibold text-white">{source.label}</p>
                          <p className="text-xs text-slate-300">{source.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {hasNegativeInfo && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Important information</p>
                  <p className="mt-1 text-sm text-amber-800">
                    The bureau flagged adverse records on this business. Review the negative information tab for detail.
                  </p>
                </div>
              </div>
            )}

            {!hasNegativeInfo && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800">
                  This profile is clear of CCJs, insolvency filings, or delinquent notices.
                </p>
              </div>
            )}

            <Card className="border border-slate-200">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-slate-200 bg-slate-50">
                  <TabsList className="flex h-auto justify-start gap-1 rounded-none bg-transparent px-2 py-2">
                    <TabsTrigger
                      value="overview"
                      className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="risk"
                      className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
                    >
                      Risk Factors
                    </TabsTrigger>
                    <TabsTrigger
                      value="negative"
                      className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-900"
                    >
                      Negative Information
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab creditReport={creditReport} />
                  </TabsContent>
                  <TabsContent value="risk" className="mt-0">
                    <RiskFactorsTab creditReport={creditReport} />
                  </TabsContent>
                  <TabsContent value="negative" className="mt-0">
                    <NegativeInformationTab creditReport={creditReport} />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>

            <div className="rounded-2xl bg-slate-900 px-8 py-6 text-center text-white">
              <p className="text-sm text-slate-300">
                This credit report is provided for informational purposes only. Connect live bureau data to keep your
                dashboard current.
              </p>
              <p className="mt-2 text-xs text-slate-500">Last updated {new Date().toLocaleDateString("en-GB")}</p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default CreditScorePage;
