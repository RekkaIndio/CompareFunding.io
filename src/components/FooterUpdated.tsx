import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import compareFundingLogo from '@/assets/comparefunding.png';

interface FooterProps {
  className?: string;
}

const FooterUpdated: React.FC<FooterProps> = ({ className }) => {
  const year = new Date().getFullYear();
  
  return (
    <footer className={cn("bg-[#212936] text-white border-t border-gray-800", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 flex flex-col">
            <div className="flex items-center">
              <img
                src={compareFundingLogo}
                alt="CompareFunding Logo"
                className="h-12 w-auto mb-2"
              />
            </div>
            <p className="mt-4 text-gray-300 text-sm">
              CompareFunding connects businesses directly with lenders through a transparent financing platform.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="#"
                className="text-gray-300 hover:text-fundhub-orange transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-fundhub-orange transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-fundhub-orange transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-fundhub-orange transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          ...existing code...

        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {year} CompareFunding. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-fundhub-orange transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-fundhub-orange transition-colors">
              Terms
            </Link>
            <Link to="/cookies" className="text-sm text-gray-400 hover:text-fundhub-orange transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterUpdated;
