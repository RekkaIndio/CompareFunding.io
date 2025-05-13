import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Twitter, Linkedin, Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps = {}) => {
  const year = new Date().getFullYear();
  
  return (
    <footer className={cn("bg-white border-t border-gray-100", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 flex flex-col">
            <Logo showTagline />
            <p className="mt-4 text-muted-foreground text-sm">
              CompareFunding connects businesses directly with lenders through a transparent financing platform.
            </p>
            <div className="flex space-x-4 mt-6">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-fundhub-blue transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-fundhub-blue transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-fundhub-blue transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-fundhub-blue transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Products
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/for-businesses" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  For Businesses
                </Link>
              </li>
              <li>
                <Link to="/for-lenders" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  For Lenders
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/integrations" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  API Docs
                </Link>
              </li>
              <li>
                <Link to="/status" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Status
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="text-sm text-foreground hover:text-fundhub-blue transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {year} CompareFunding. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-fundhub-blue transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-fundhub-blue transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-fundhub-blue transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
