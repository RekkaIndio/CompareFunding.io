import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Mail, Phone, Globe, Building2, AlertCircle } from 'lucide-react';

interface LenderProfile {
  id: string;
  lender_name?: string;
  company_name?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  postal_code?: string;
  established_year?: number;
}

interface LenderConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lender: LenderProfile | null;
  isConnecting: boolean;
  connectedLendersCount: number;
}

const LenderConnectionModal: React.FC<LenderConnectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lender,
  isConnecting,
  connectedLendersCount
}) => {
  if (!lender) return null;

  const lenderName = lender.lender_name || lender.company_name || 'this lender';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#212936] text-lg">
            <div className="p-2 bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-xl">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            Connect with {lenderName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Lender Info */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-3">
              {lender.logo_url ? (
                <img 
                  src={lender.logo_url} 
                  alt={`${lenderName} logo`}
                  className="h-10 w-10 rounded-xl object-contain bg-white p-2 shadow-sm border border-slate-200"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-[#212936] to-[#2a3441] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {lenderName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-[#212936]">{lenderName}</h3>
                {lender.established_year && (
                  <p className="text-xs text-slate-600">
                    Established {lender.established_year}
                  </p>
                )}
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-1 text-xs text-slate-600">
              {lender.email && (
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white rounded-lg shadow-sm">
                    <Mail className="h-3 w-3 text-[#ff8000]" />
                  </div>
                  <span>{lender.email}</span>
                </div>
              )}
              {lender.website && (
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white rounded-lg shadow-sm">
                    <Globe className="h-3 w-3 text-[#ff8000]" />
                  </div>
                  <span>{lender.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#212936] flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-lg">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
              What happens next?
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-1 bg-gradient-to-br from-[#212936] to-[#2a3441] rounded-full">
                    <div className="h-1 w-1 bg-[#ff8000] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#212936] mb-1 text-sm">Your application is sent immediately</p>
                  <p className="text-xs text-slate-600">Your application details will be securely transmitted to {lenderName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-1 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full">
                    <div className="h-1 w-1 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#212936] mb-1 text-sm">Lender reviews your application</p>
                  <p className="text-xs text-slate-600">The lender will review your business details and funding requirements</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-1 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full">
                    <div className="h-1 w-1 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#212936] mb-1 text-sm">You'll be notified of their decision</p>
                  <p className="text-xs text-slate-600">Receive updates via email and in your dashboard about their review progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connection limit info */}
          <div className="bg-gradient-to-r from-[#ff8000]/10 to-[#ffaa00]/10 border border-[#ff8000]/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-[#ff8000] rounded-lg">
                <AlertCircle className="h-3 w-3 text-white" />
              </div>
              <span className="font-semibold text-[#212936] text-sm">Connection Limit</span>
            </div>
            <p className="text-xs text-slate-700">
              You can connect with up to 5 lenders per application. 
              {connectedLendersCount > 0 && (
                <span className="font-semibold text-[#ff8000]">
                  {' '}You have {5 - connectedLendersCount} connection{5 - connectedLendersCount !== 1 ? 's' : ''} remaining.
                </span>
              )}
            </p>
          </div>

          {/* Expected timeline */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-[#212936] rounded-lg">
                <Clock className="h-3 w-3 text-[#ff8000]" />
              </div>
              <span className="font-semibold text-[#212936] text-sm">Expected Timeline</span>
            </div>
            <p className="text-xs text-slate-700">
              Most lenders review applications within 1-3 business days. 
              You'll receive notifications at each stage of the process.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isConnecting}
            className="bg-[#212936] border-[#212936] text-white hover:bg-[#2a3441] hover:border-[#2a3441]"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isConnecting}
            className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              'Connect with Lender'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LenderConnectionModal;
