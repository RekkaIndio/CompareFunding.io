
import {
  ArrowRight,
  Building2,
  Layers,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const primaryProducts = [
  {
    title: 'Cashflow Finance',
    description: 'Stabilise cash gaps, repay flexibly, and keep payroll humming with revolving access.',
    range: '£25k - £5m | up to 36 months',
    icon: PiggyBank
  },
  {
    title: 'Asset & Equipment',
    description: 'Spread the cost of fleet, machinery, and hardware over predictable terms.',
    range: '£50k - £10m | 12-84 months',
    icon: Layers
  },
  {
    title: 'Property & Bridging',
    description: 'Unlock development capital and bridge finance without hidden broker spreads.',
    range: '£250k - £30m | bespoke',
    icon: Building2
  },
  {
    title: 'Growth & M&A',
    description: 'Scale, acquire, or extend runway with structured capital stacks matched to your plan.',
    range: '£100k - £25m | tailored',
    icon: TrendingUp
  }
];

const specialtyProducts = [
  'Invoice Finance & Factoring',
  'Purchase Order & Trade',
  'Revolving Credit Facilities',
  'Commercial Mortgages',
  'Stock & Inventory Finance',
  'VAT & Tax Loans'
];

const proofPoints = [
  {
    title: 'Whole-of-market view',
    description: '180+ lenders benchmarked daily so you see realistic rates, not brochureware.',
    icon: ShieldCheck
  },
  {
    title: 'Faster underwriting',
    description: 'Analysts package your data room and push it direct to credit teams in 48h.',
    icon: Sparkles
  },
  {
    title: 'Transparent pricing',
    description: 'No broker markups—compare fees, covenants and drawdown timelines side-by-side.',
    icon: ArrowRight
  }
];

const teamMembers = [
  {
    name: 'Scott Kirby',
    role: 'Co-Founder & CEO',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    gradient: 'from-blue-900 to-blue-800'
  },
  {
    name: 'Robin Souter',
    role: 'Head of Capital Markets',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    gradient: 'from-gray-900 to-gray-700'
  },
  {
    name: 'Michael Jacobson',
    role: 'Head of Engineering',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    gradient: 'from-slate-800 to-slate-700'
  },
  {
    name: 'Jamie Mason-Wright',
    role: 'Co-Founder & CTO',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face&auto=format&q=80',
    gradient: 'from-blue-800 to-orange-500'
  }
];

const lenderLogos = ['LUNAR', 'Revolut', 'NatWest', 'Santander', 'Lloyds', 'Klarna'];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-[0.3em]">Funding OS</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4 leading-tight">
            Pick the right product, see the real costs, move faster
          </h2>
          <p className="text-lg text-gray-600 mt-4">
            CompareFunding pairs real analysts with a transparent marketplace so you can plan capital stacks without endless broker calls.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {primaryProducts.map((product) => (
                <div key={product.title} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                    <product.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.range}</p>
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed">{product.description}</p>
                  <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-900 mt-4">
                    View live lenders <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-100 grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold text-orange-500 uppercase tracking-wide">Specialist playbook</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-3">Whatever the need, there is a channel</h3>
                <p className="text-gray-600 mt-4 text-sm">
                  Plug in niche products without re-keying the same information. One profile unlocks structured, secured, and revolving solutions.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specialtyProducts.map((product) => (
                    <div key={product} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {product}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden min-h-[260px]">
                <img
                  src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=900&auto=format&fit=crop&q=80"
                  alt="Funding analyst at work"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Live mandate</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-2xl font-semibold">£4.2m</p>
                      <p className="text-xs text-white/70">Working capital
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">3 offers</p>
                      <p className="text-xs text-white/70">Term sheet review</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proofPoints.map((proof) => (
                <div key={proof.title} className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <proof.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-semibold">{proof.title}</h4>
                  <p className="text-sm text-white/80 mt-2 leading-relaxed">{proof.description}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 flex flex-col">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-wide">Need an expert?</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-3">Talk to the funding desk</h3>
            <p className="text-sm text-gray-600 mt-3">
              Compare fees, covenants, and drawdown timings before you commit. Our analysts normalise lender offers so you do not have to decode them.
            </p>
            <div className="mt-6 space-y-4 text-sm text-gray-700">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Transparent fee breakdowns
              </div>
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Application pack done for you
              </div>
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Indicative offers in ~48h
              </div>
            </div>
            <div className="mt-auto space-y-3 pt-8">
              <Link
                to="/contact"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 text-white font-semibold py-3 rounded-xl hover:bg-blue-800"
              >
                Book a call <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/apply"
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 font-semibold py-3 rounded-xl text-gray-900 hover:border-gray-400"
              >
                Submit profile
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-20 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <div key={member.name} className="relative">
                <div className={`aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${member.gradient}`}>
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-xs opacity-80">{member.role}</p>
                  <p className="font-semibold text-sm">{member.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Transparent access to finance, no hidden fees</h3>
          <p className="text-gray-600 text-lg mb-10">Remove the broker, access all products with CompareFunding, and see the savings.</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-70">
            {lenderLogos.map((logo) => (
              <div key={logo} className="h-10 flex items-center">
                {logo === 'NatWest' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">NW</div>
                    <span className="text-xl font-semibold text-gray-800">NatWest</span>
                  </div>
                ) : logo === 'Santander' ? (
                  <span className="text-xl font-semibold text-gray-800">Santander</span>
                ) : logo === 'Lloyds' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs">🐎</div>
                    <span className="text-xl font-bold text-gray-800">Lloyds</span>
                  </div>
                ) : logo === 'Klarna' ? (
                  <span className="text-xl font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded">Klarna.</span>
                ) : (
                  <span className="text-2xl font-semibold text-gray-800">{logo}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
