import React from 'react';
import StatusBadge from '@/components/StatusBadge';
import { formatApplicationNumber } from '@/lib/applicationUtils';

interface ApplicationHeaderProps {
  application: any;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ application }) => {
  if (!application) return null;
  
  return (
    <div className="bg-[#212936] text-white rounded-xl p-8 mb-8 shadow-xl border-b-2 border-[#ff8000]">
      <h1 className="text-4xl font-bold mb-3 tracking-tight">
        {application?.isLender 
          ? `Application #${formatApplicationNumber(application, application?.id)}`
          : 'Application Details'
        }
      </h1>
      <div className="flex items-center space-x-3 mb-3">
        {application && <StatusBadge status={application.status} />}
        <p className="text-gray-200 text-md">
          Submitted {application?.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
        </p>
      </div>
      <p className="text-gray-200 text-lg leading-relaxed">
        {application?.isLender 
          ? 'Full business information and loan application details'
          : 'Review your submitted application and track lender interactions'
        }
      </p>
    </div>
  );
};

export default ApplicationHeader;
