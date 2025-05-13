import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Twitter, Linkedin, Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

const FooterUpdated: React.FC<FooterProps> = ({ className }) => {
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
          
          {/* Rest of the footer remains the same */}
          
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
      </div>
    </footer>
  );
};

export default FooterUpdated;
