import { Navigate } from 'react-router-dom';

/**
 * This component has been refactored into smaller components
 * and moved to the Lender directory structure.
 * This file now serves as a redirect to maintain backward compatibility.
 * Updated to ensure all applications are displayed when redirected
 */
const MatchedApplicationsRedirect = () => {
  // Redirect to the Lender MatchedApplications page with the 'all' filter parameter
  return <Navigate to="/lender/matched-applications?filter=all" replace />;
};

export default MatchedApplicationsRedirect;
