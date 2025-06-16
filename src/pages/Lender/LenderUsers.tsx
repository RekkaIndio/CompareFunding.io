import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Edit2, 
  Trash2, 
  Search,
  Filter,
  Download,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  Settings,
  Plus,
  BarChart3,
  Activity
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, createDocument, getDocuments, deleteDocument } from '@/firebase';

interface LenderUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  lastLogin?: string;
  invitedDate: string;
  department?: string;
  permissions: string[];
  lender_id: string; // Reference to the parent lender organization
  invited_by?: string; // User ID of who invited them
}

interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  department: string;
  permissions: string[];
}

const LenderUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    department: '',
    permissions: []
  });

  // Fetch current lender profile
  const { data: lenderProfile } = useQuery({
    queryKey: ['lenderProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      const { data, error } = await getDocument('lender_profiles', user.uid);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch team members/users for this lender
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['lenderUsers', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      // Get all users for this lender organization
      const { data, error } = await getDocuments('lender_users', [
        { field: 'lender_id', operator: '==', value: user.uid }
      ]);
      
      if (error) {
        console.error('Error fetching lender users:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  const rolePermissions = {
    admin: ['view_applications', 'approve_loans', 'manage_users', 'view_reports', 'manage_settings'],
    manager: ['view_applications', 'approve_loans', 'view_reports'],
    analyst: ['view_applications', 'view_reports'],
    viewer: ['view_applications']
  };

  const handleInviteUser = async () => {
    try {
      if (!user?.uid || !lenderProfile) {
        toast.error('Unable to send invitation at this time');
        return;
      }
      
      // Validate form
      if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check if user already exists
      const existingUsers = users || [];
      if (existingUsers.some((u: LenderUser) => u.email.toLowerCase() === inviteForm.email.toLowerCase())) {
        toast.error('A user with this email already exists');
        return;
      }

      const newUser: Omit<LenderUser, 'id'> = {
        ...inviteForm,
        status: 'pending',
        invitedDate: new Date().toISOString(),
        permissions: rolePermissions[inviteForm.role],
        lender_id: user.uid,
        invited_by: user.uid
      };

      // Create user document
      const { error } = await createDocument('lender_users', newUser);
      
      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      // TODO: Send invitation email here
      // This would integrate with your email service
      
      // Reset form and refresh data
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
        department: '',
        permissions: []
      });
      
      setShowInviteForm(false);
      refetch(); // Refresh the users list
      toast.success('Invitation sent successfully!');
      
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await deleteDocument('lender_users', userId);
      
      if (error) {
        throw new Error(`Failed to remove user: ${error.message}`);
      }
      
      refetch(); // Refresh the users list
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove user');
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await updateDocument('lender_users', userId, {
        status: newStatus,
        lastLogin: newStatus === 'active' ? new Date().toISOString() : undefined
      });
      
      if (error) {
        throw new Error(`Failed to update user status: ${error.message}`);
      }
      
      refetch(); // Refresh the users list
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const filteredUsers = (users || []).filter((user: LenderUser) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analyst':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-[#ff8000] animate-spin" />
              <span className="text-gray-600">Loading team members...</span>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
                <p className="text-gray-600">Manage team access and permissions for your lending platform</p>
              </div>
              <Button 
                onClick={() => setShowInviteForm(true)}
                className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Team Members</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(users || []).filter((u: LenderUser) => u.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(users || []).filter((u: LenderUser) => u.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-red-100 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(users || []).filter((u: LenderUser) => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search team members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                  
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent bg-white text-gray-900 shadow-sm"
                  >
                    <option value="all" className="text-gray-900 bg-white">All Roles</option>
                    <option value="admin" className="text-gray-900 bg-white">Admin</option>
                    <option value="manager" className="text-gray-900 bg-white">Manager</option>
                    <option value="analyst" className="text-gray-900 bg-white">Analyst</option>
                    <option value="viewer" className="text-gray-900 bg-white">Viewer</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent bg-white text-gray-900 shadow-sm"
                  >
                    <option value="all" className="text-gray-900 bg-white">All Status</option>
                    <option value="active" className="text-gray-900 bg-white">Active</option>
                    <option value="pending" className="text-gray-900 bg-white">Pending</option>
                    <option value="inactive" className="text-gray-900 bg-white">Inactive</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-800 bg-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-800 bg-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Table */}
          <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                <Users className="h-5 w-5 mr-2 text-[#ff8000]" />
                Team Members ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No team members found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Get started by inviting your first team member'}
                  </p>
                  {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
                    <Button 
                      onClick={() => setShowInviteForm(true)}
                      className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite First Team Member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((teamMember: LenderUser) => (
                        <tr key={teamMember.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#ff8000] to-[#ffaa00] flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {teamMember.firstName[0]}{teamMember.lastName[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {teamMember.firstName} {teamMember.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{teamMember.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(teamMember.role)}`}>
                              {teamMember.role.charAt(0).toUpperCase() + teamMember.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(teamMember.status)}
                              <span className="ml-2 text-sm text-gray-900 capitalize">{teamMember.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {teamMember.department || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teamMember.lastLogin ? new Date(teamMember.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {teamMember.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateUserStatus(teamMember.id, 'active')}
                                  className="text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 bg-white"
                                >
                                  Activate
                                </Button>
                              )}
                              {teamMember.status === 'active' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateUserStatus(teamMember.id, 'inactive')}
                                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-800 bg-white"
                                >
                                  Deactivate
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveUser(teamMember.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite User Modal */}
          {showInviteForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowInviteForm(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={inviteForm.firstName}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={inviteForm.lastName}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent"
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent"
                      placeholder="john.smith@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="viewer" className="text-gray-900 bg-white">Viewer - Can view applications only</option>
                      <option value="analyst" className="text-gray-900 bg-white">Analyst - Can view applications and reports</option>
                      <option value="manager" className="text-gray-900 bg-white">Manager - Can approve loans and view reports</option>
                      <option value="admin" className="text-gray-900 bg-white">Admin - Full access including user management</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={inviteForm.department}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-transparent"
                      placeholder="e.g., Underwriting, Risk Assessment, etc."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInviteForm(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-800 bg-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteUser}
                    className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default LenderUsers;
