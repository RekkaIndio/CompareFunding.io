import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Clock4,
  Globe2,
  LineChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound
} from 'lucide-react';

const stats = [
  {
    label: 'Average approval time',
    value: '9 days',
    detail: 'Based on 2025 YTD',
    icon: Clock4
  },
  {
    label: 'Lenders compared',
    value: '180+',
    detail: 'Banks & alt lenders',
    icon: Globe2
  },
  {
    label: 'Total funded',
    value: '£420M',
    detail: 'In the last 12 months',
    icon: LineChart
  },
  {
    label: 'Average savings',
    value: '1.2%',
    detail: 'Rate reduction vs broker fees',
    icon: ShieldCheck
  }
];

const industries = [
  'Manufacturing & supply chain',
  'E-commerce & retail groups',
  'Property & development',
  'Professional services',
  'Healthcare & life sciences',
  'Logistics & fleet finance'
];

const insights = [
  {
    title: 'Funding desk coverage',
    description: 'Real humans benchmark every lender daily to surface the best indicative terms.',
    icon: UsersRound
  },
  {
    title: 'Live market intelligence',
    description: 'We monitor repricing events and appetite changes, so you only see realistic offers.',
    icon: TrendingUp
  },
  {
    title: 'Dedicated analyst',
    description: 'One point of contact that shapes your data room and negotiates with lenders.',
    icon: Building2
  }
];

const MomentumSection = () => {
  return (
    <section className="relative py-20 bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-y-0 right-0 left-1/2 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-900/40 blur-3xl" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-orange-400 font-semibold uppercase tracking-[0.3em] text-xs">Proof we deliver</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 leading-tight">
            Funding momentum without the noise
          </h2>
          <p className="text-lg text-slate-300 mt-4">
            CompareFunding pairs real analysts with realtime market intelligence so every application lands with the right lender, first time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col gap-3"
                >
                  <stat.icon className="w-6 h-6 text-orange-300" />
                  <div>
                    <p className="text-sm text-slate-300">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-sm font-semibold text-orange-500 uppercase tracking-wide">Recent wins</p>
                  <h3 className="text-3xl font-bold mt-3">£42M funded last quarter</h3>
                  <p className="text-gray-600 mt-4">
                    Working capital, acquistions, fleet refreshes and property deals closed across 63 lenders without broker markups.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
                    >
                      Explore live deals <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-slate-300 text-sm font-semibold text-slate-900 hover:border-slate-900"
                    >
                      Talk to a specialist
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-lg min-h-[260px]">
                  <img
                    src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=900&auto=format&fit=crop&q=80"
                    alt="Analyst reviewing funding dashboard"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/0 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                    <p className="text-sm uppercase text-orange-300 tracking-wide">Live pipeline</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-xl font-semibold">£6.4M</p>
                        <p className="text-xs text-slate-200">Offers in negotiation</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold">12</p>
                        <p className="text-xs text-slate-200">Active lenders</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Coverage</p>
                <h3 className="text-2xl font-semibold mt-4">Industries we fast-track</h3>
                <p className="text-slate-300 mt-3">
                  Transparent data rooms, lender-ready packs, and curated product matches for each vertical.
                </p>
                <ul className="mt-6 space-y-3">
                  {industries.map((industry) => (
                    <li key={industry} className="flex items-center gap-3 text-sm text-white/80">
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      {industry}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-6 shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Playbook</p>
                <h3 className="text-2xl font-semibold mt-4">How we stay ahead</h3>
                <p className="text-white/80 mt-3">
                  Daily lender stand-ups, shared deal intelligence, and predictive appetite scoring keep your application moving.
                </p>
                <div className="mt-6 space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.title} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <insight.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{insight.title}</p>
                        <p className="text-sm text-white/80">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="bg-white text-slate-900 rounded-3xl p-8 flex flex-col shadow-xl border border-slate-100">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-wide">Funding desk</p>
            <h3 className="text-3xl font-bold mt-3">Work 1:1 with analysts</h3>
            <p className="text-slate-600 mt-4">
              We benchmark every lender, normalise fees, and surface the smartest capital stack for your next move.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">Data room in a day</p>
                  <p className="text-sm text-slate-600">Secure document upload, automated parsing, human review.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock4 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold">First offers in 48h</p>
                  <p className="text-sm text-slate-600">Fast-track routes direct to credit teams.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold">Transparent pricing</p>
                  <p className="text-sm text-slate-600">We show every fee and compare broker spreads.</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Link
                to="/support-flow"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-800"
              >
                Book an intro call <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-slate-500 mt-4">
                Prefer email? Reach our team at <span className="font-semibold text-slate-700">support@comparefunding.io</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MomentumSection;
