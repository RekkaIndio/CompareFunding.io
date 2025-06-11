import { getDocuments, getDocument } from '@/firebase';

export interface ConnectionRequest {
  id: string;
  application_id: string;
  lender_id: string;
  business_id: string;
  application_data: {
    application_number: string;
    business_name: string;
    product_type: string;
    loan_amount: number;
    loan_term_months: number;
    purpose: string;
    industry: string;
    years_trading: number;
    annual_revenue: number;
  };
  status: 'pending' | 'accepted' | 'declined';
  connected_at: string;
  responded_at?: string;
  full_application?: any; // Full application data after connection is accepted
  business_profile?: any; // Business profile data
}

export async function getLenderConnectionRequests(lenderId: string): Promise<{
  data: ConnectionRequest[] | null;
  error: any;
}> {
  try {
    // Get all connection requests for this lender
    const { data: connections, error: connectionsError } = await getDocuments('lender_connections', [
      { field: 'lender_id', operator: '==', value: lenderId }
    ], [{ field: 'connected_at', direction: 'desc' }]);

    if (connectionsError) {
      return { data: null, error: connectionsError };
    }

    if (!connections || connections.length === 0) {
      return { data: [], error: null };
    }

    // Enhance each connection with additional data if needed
    const enhancedConnections = await Promise.all(
      connections.map(async (connection) => {
        let enhancedConnection = { ...connection } as ConnectionRequest;

        // If connection is accepted, get the full application details
        if (connection.status === 'accepted') {
          try {
            const { data: fullApplication } = await getDocument('applications', connection.application_id);
            if (fullApplication) {
              enhancedConnection.full_application = fullApplication;
            }

            // Get business profile for enhanced display
            const { data: businessProfile } = await getDocument('businesses', connection.business_id);
            if (businessProfile) {
              enhancedConnection.business_profile = businessProfile;
            }
          } catch (error) {
            console.warn('Error fetching additional connection data:', error);
          }
        }

        return enhancedConnection;
      })
    );

    return { data: enhancedConnections, error: null };
  } catch (error) {
    console.error('Error fetching lender connection requests:', error);
    return { data: null, error };
  }
}

export async function getLenderConnectedApplications(lenderId: string): Promise<{
  data: any[] | null;
  error: any;
}> {
  try {
    // Get accepted connections
    const { data: acceptedConnections, error: connectionsError } = await getDocuments('lender_connections', [
      { field: 'lender_id', operator: '==', value: lenderId },
      { field: 'status', operator: '==', value: 'accepted' }
    ]);

    if (connectionsError) {
      return { data: null, error: connectionsError };
    }

    if (!acceptedConnections || acceptedConnections.length === 0) {
      return { data: [], error: null };
    }

    // Get full application details for each accepted connection
    const connectedApplications = await Promise.all(
      acceptedConnections.map(async (connection) => {
        try {
          const { data: application } = await getDocument('applications', connection.application_id);
          const { data: business } = await getDocument('businesses', connection.business_id);
          
          if (application) {
            return {
              ...application,
              connection_id: connection.id,
              connected_at: connection.connected_at,
              business_profile: business,
              isConnected: true,
              connectionStatus: 'accepted'
            };
          }
          return null;
        } catch (error) {
          console.warn('Error fetching application for connection:', connection.id, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validApplications = connectedApplications.filter(app => app !== null);

    return { data: validApplications, error: null };
  } catch (error) {
    console.error('Error fetching connected applications:', error);
    return { data: null, error };
  }
}

export async function acceptConnectionRequest(connectionId: string): Promise<{
  success: boolean;
  error?: any;
}> {
  try {
    const { updateDocument } = await import('@/firebase');
    
    const { error } = await updateDocument('lender_connections', connectionId, {
      status: 'accepted',
      responded_at: new Date().toISOString()
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting connection request:', error);
    return { success: false, error };
  }
}

export async function declineConnectionRequest(connectionId: string): Promise<{
  success: boolean;
  error?: any;
}> {
  try {
    const { updateDocument } = await import('@/firebase');
    
    const { error } = await updateDocument('lender_connections', connectionId, {
      status: 'declined',
      responded_at: new Date().toISOString()
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error declining connection request:', error);
    return { success: false, error };
  }
}
