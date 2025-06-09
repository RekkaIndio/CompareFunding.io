import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import compareFundingLogo from '@/assets/comparefunding.png';

interface FooterProps {
  className?: string;
}

const FooterUpdated = ({ className }: FooterProps) => {
  const year = new Date().getFullYear();
  
  return (
    <footer className={cn("bg-slate-900 text-white relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center mb-3">
              <img 
                src={compareFundingLogo} 
                alt="CompareFunding Logo" 
                className="h-10 w-auto filter brightness-110"
              />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4 max-w-md">
              Connecting businesses with the right funding solutions through our transparent, AI-powered platform.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-orange-400" />
                <span className="text-slate-300 text-sm">hello@comparefunding.io</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-orange-400" />
                <span className="text-slate-300 text-sm">+44 20 7946 0958</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-orange-400" />
                <span className="text-slate-300 text-sm">71-75 SHELTON STREET, COVENT GARDEN, LONDON, WC2H 9JQ</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-2">
              <a 
                href="#" 
                className="bg-slate-800/50 hover:bg-orange-500/20 p-2 rounded-full transition-all duration-300 hover:scale-110 group border border-slate-700/50"
                aria-label="Twitter"
              >
                <Twitter size={14} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
              </a>
              <a 
                href="#" 
                className="bg-slate-800/50 hover:bg-orange-500/20 p-2 rounded-full transition-all duration-300 hover:scale-110 group border border-slate-700/50"
                aria-label="LinkedIn"
              >
                <Linkedin size={14} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
              </a>
              <a 
                href="#" 
                className="bg-slate-800/50 hover:bg-orange-500/20 p-2 rounded-full transition-all duration-300 hover:scale-110 group border border-slate-700/50"
                aria-label="Facebook"
              >
                <Facebook size={14} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
              </a>
              <a 
                href="#" 
                className="bg-slate-800/50 hover:bg-orange-500/20 p-2 rounded-full transition-all duration-300 hover:scale-110 group border border-slate-700/50"
                aria-label="Instagram"
              >
                <Instagram size={14} className="text-slate-400 group-hover:text-orange-400 transition-colors" />
              </a>
            </div>
          </div>
          
          {/* Company Links */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white mb-3 text-sm">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  About Us
                </Link>
              </li>
              
              <li>
                <Link to="/team" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  Our Team
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Products Links */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white mb-3 text-sm">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/for-businesses" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  For Businesses
                </Link>
              </li>
              <li>
                <Link to="/for-lenders" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  For Lenders
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources Links */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white mb-3 text-sm">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                  Guides
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-white mb-3 text-sm">Legal & Support</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/cookies" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/compliance" className="text-slate-300 hover:text-orange-400 transition-colors text-sm hover:translate-x-1 inline-block duration-200">
                      Compliance
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                  <h4 className="text-white font-medium text-xs mb-1">Need Help?</h4>
                  <Link 
                    to="/contact" 
                    className="inline-flex items-center px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-md transition-colors duration-200"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-slate-700/50 mt-8 pt-4">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
            <div className="flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-4">
              <p className="text-slate-400 text-sm">
                &copy; {year} CompareFunding. All rights reserved.
              </p>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
              
                <span>•</span>
                <span>Company No. 15908176</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/privacy" className="text-slate-400 hover:text-orange-400 transition-colors text-sm">
                Privacy
              </Link>
              <Link to="/terms" className="text-slate-400 hover:text-orange-400 transition-colors text-sm">
                Terms
              </Link>
              <Link to="/cookies" className="text-slate-400 hover:text-orange-400 transition-colors text-sm">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterUpdated;
