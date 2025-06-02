import { Navigate } from 'react-router-dom';

/**
 * This component has been refactored into smaller components
 * and moved to the Lender directory structure.
 * This file now serves as a redirect to maintain backward compatibility.
 */
const MatchedApplicationsRedirect = () => {
  return <Navigate to="/lender/matched-applications" replace />;
};

export default MatchedApplicationsRedirect;
