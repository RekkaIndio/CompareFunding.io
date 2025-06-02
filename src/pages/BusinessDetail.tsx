import { useParams } from 'react-router-dom';
import BusinessDetailPage from './Lender/BusinessDetail/BusinessDetailPage';

const BusinessDetail = () => {
  const { id } = useParams();
  
  if (!id) {
    return null;
  }

  return <BusinessDetailPage />;
};

export default BusinessDetail;
