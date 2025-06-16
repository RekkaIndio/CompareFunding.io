import React, { useState } from 'react';

export type SupportStep =
  | 'start'
  | 'call-now'
  | 'who-you'
  | 'business-info'
  | 'appointment-scheduled'
  | 'appointment-happened'
  | 'post-appointment';

const initialUser = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  role: '',
};
const initialBusiness = {
  businessName: '',
  companyNumber: '',
  website: '',
  industry: '',
  turnover: '',
  companySize: '',
  bank: '',
};

const SupportFlowModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<SupportStep>('start');
  const [user, setUser] = useState(initialUser);
  const [business, setBusiness] = useState(initialBusiness);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [postChoice, setPostChoice] = useState('');

  if (!open) return null;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (step === 'who-you') setUser({ ...user, [name]: value });
    if (step === 'business-info') setBusiness({ ...business, [name]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        {/* Stepper */}
        {step === 'start' && (
          <>
            <h2 className="text-xl font-bold mb-4">How can we help?</h2>
            <div className="space-y-4">
              <button className="w-full btn-primary" onClick={() => setStep('call-now')}>Call now</button>
              <button className="w-full btn-secondary" onClick={() => setStep('who-you')}>Book a free consultation</button>
            </div>
          </>
        )}
        {step === 'call-now' && (
          <>
            <h2 className="text-xl font-bold mb-4">Call us now</h2>
            <p className="mb-4">Please call <a href="tel:0800123456" className="text-blue-600 font-bold">0800 123 456</a> to speak with a funding specialist.</p>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </>
        )}
        {step === 'who-you' && (
          <form onSubmit={e => { e.preventDefault(); setStep('business-info'); }}>
            <h2 className="text-xl font-bold mb-4">Who are you?</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input name="firstName" placeholder="First Name" value={user.firstName} onChange={handleInput} required className="input" />
              <input name="lastName" placeholder="Last Name" value={user.lastName} onChange={handleInput} required className="input" />
            </div>
            <input name="email" placeholder="Email" value={user.email} onChange={handleInput} required className="input mb-3" />
            <input name="mobile" placeholder="Mobile" value={user.mobile} onChange={handleInput} required className="input mb-3" />
            <input name="role" placeholder="Role (e.g. Business Owner)" value={user.role} onChange={handleInput} required className="input mb-4" />
            <button className="btn-primary w-full" type="submit">Next</button>
          </form>
        )}
        {step === 'business-info' && (
          <form onSubmit={e => { e.preventDefault(); setStep('appointment-scheduled'); }}>
            <h2 className="text-xl font-bold mb-4">Tell us about your business</h2>
            <input name="businessName" placeholder="Business Name" value={business.businessName} onChange={handleInput} required className="input mb-3" />
            <input name="companyNumber" placeholder="Company Number" value={business.companyNumber} onChange={handleInput} required className="input mb-3" />
            <input name="website" placeholder="Website" value={business.website} onChange={handleInput} className="input mb-3" />
            <input name="industry" placeholder="Industry/Sector" value={business.industry} onChange={handleInput} required className="input mb-3" />
            <input name="turnover" placeholder="Forecast Turnover" value={business.turnover} onChange={handleInput} required className="input mb-3" />
            <input name="companySize" placeholder="Company Size" value={business.companySize} onChange={handleInput} required className="input mb-3" />
            <input name="bank" placeholder="Bank" value={business.bank} onChange={handleInput} required className="input mb-4" />
            <button className="btn-primary w-full" type="submit">Book Appointment</button>
          </form>
        )}
        {step === 'appointment-scheduled' && (
          <>
            <h2 className="text-xl font-bold mb-4">Appointment Scheduled</h2>
            <p className="mb-4">An email invite has been sent to you and your advisor. Please check your inbox.</p>
            <button className="btn-primary w-full mb-2" onClick={() => setStep('appointment-happened')}>Continue</button>
          </>
        )}
        {step === 'appointment-happened' && (
          <>
            <h2 className="text-xl font-bold mb-4">Appointment Complete</h2>
            <p className="mb-4">What would you like to do next?</p>
            <div className="space-y-3">
              <button className="btn-primary w-full" onClick={() => { setPostChoice('product'); setStep('post-appointment'); }}>Apply for a specific product</button>
              <button className="btn-primary w-full" onClick={() => { setPostChoice('use'); setStep('post-appointment'); }}>Apply for a specific use</button>
              <button className="btn-secondary w-full" onClick={() => { setPostChoice('not-sure'); setStep('post-appointment'); }}>Not sure</button>
            </div>
          </>
        )}
        {step === 'post-appointment' && (
          <>
            {postChoice === 'product' && <p className="mb-4">Redirecting to product application...</p>}
            {postChoice === 'use' && <p className="mb-4">Redirecting to use-case application...</p>}
            {postChoice === 'not-sure' && <p className="mb-4">We will keep in touch to help you find the right funding.</p>}
            <button className="btn-secondary w-full" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
};

export default SupportFlowModal;
