import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { 
  FileText, 
  Factory, 
  Building, 
  RotateCcw, 
  Package, 
  Shield, 
  Receipt, 
  ShoppingCart, 
  Calendar,
  RefreshCw,
  Hammer,
  MapPin,
  Home,
  TrendingUp,
  PoundSterling,
  CreditCard,
  Truck,
  Ship,
  PiggyBank
} from 'lucide-react';

const Products = () => {
  const fundingProducts = [
    {
      id: 'invoice-finance',
      title: 'Invoice Finance',
      icon: <FileText className="h-12 w-12 text-blue-600" />,
    },
    {
      id: 'factoring',
      title: 'Factoring',
      icon: <Factory className="h-12 w-12 text-green-600" />,
    },
    {
      id: 'commercial-mortgages',
      title: 'Commercial Mortgages',
      icon: <Building className="h-12 w-12 text-purple-600" />,
    },
    {
      id: 'revolving-credit',
      title: 'Revolving Credit Facilities',
      icon: <RotateCcw className="h-12 w-12 text-orange-600" />,
    },
    {
      id: 'stock-finance',
      title: 'Stock Finance',
      icon: <Package className="h-12 w-12 text-red-600" />,
    },
    {
      id: 'secured-loans',
      title: 'Secured Loans',
      icon: <Shield className="h-12 w-12 text-indigo-600" />,
    },
    {
      id: 'vat-loans',
      title: 'VAT Loans',
      icon: <Receipt className="h-12 w-12 text-pink-600" />,
    },
    {
      id: 'hire-purchase',
      title: 'Hire Purchase',
      icon: <ShoppingCart className="h-12 w-12 text-teal-600" />,
    },
    {
      id: 'leasing',
      title: 'Leasing',
      icon: <Calendar className="h-12 w-12 text-cyan-600" />,
    },
    {
      id: 'refinancing',
      title: 'Refinancing',
      icon: <RefreshCw className="h-12 w-12 text-yellow-600" />,
    },
    {
      id: 'development-finance',
      title: 'Development Finance',
      icon: <Hammer className="h-12 w-12 text-amber-600" />,
    },
    {
      id: 'bridging-loans',
      title: 'Bridging Loans',
      icon: <MapPin className="h-12 w-12 text-emerald-600" />,
    },
    {
      id: 'buy-to-let',
      title: 'Buy to Let',
      icon: <Home className="h-12 w-12 text-lime-600" />,
    },
    {
      id: 'term-loans',
      title: 'Term Loans',
      icon: <TrendingUp className="h-12 w-12 text-violet-600" />,
    },
    {
      id: 'angel-investment',
      title: 'Angel Investment',
      icon: <PoundSterling className="h-12 w-12 text-rose-600" />,
    },
    {
      id: 'grant-funding',
      title: 'Grant Funding',
      icon: <PiggyBank className="h-12 w-12 text-sky-600" />,
    },
    {
      id: 'letter-of-credit',
      title: 'Letter of Credit',
      icon: <CreditCard className="h-12 w-12 text-stone-600" />,
    },
    {
      id: 'supply-chain-finance',
      title: 'Supply Chain Finance',
      icon: <Truck className="h-12 w-12 text-slate-600" />,
    },
    {
      id: 'trade-loans',
      title: 'Trade Loans',
      icon: <Ship className="h-12 w-12 text-gray-600" />,
    },
    {
      id: 'export-finance',
      title: 'Export Finance',
      icon: <Ship className="h-12 w-12 text-neutral-600" />,
    },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              All the different financial products we offer
            </h1>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {fundingProducts.map((product) => (
              <Link
                key={product.id}
                to={`/signup-journey/email-password?product=${product.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 text-center cursor-pointer group"
              >
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {product.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{product.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Products;
