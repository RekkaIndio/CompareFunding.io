import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input as BaseInput } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select as BaseSelect, SelectContent, SelectItem, SelectTrigger as BaseSelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea as BaseTextarea } from '../../components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Building2, 
  PoundSterling, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Percent, 
  Clock, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDocument, updateDocument, getDocuments, createDocument } from '../../firebase';
import { toast } from 'sonner';
import type { CurrentLoan, CurrentLendingData, SignUpCurrentFunding } from '../../types/funding';
import { convertSignUpToCurrentLending, formatCurrency, formatDate } from '../../types/funding';

// Override Input, Textarea, and Select components with styles
const Input = (props) => <BaseInput className="bg-white border border-slate-900 placeholder:text-slate-600" {...props} />;
const Textarea = (props) => <BaseTextarea className="bg-white border border-slate-900 placeholder:text-slate-600" {...props} />;
const Select = (props) => <BaseSelect {...props} />;
const SelectTrigger = (props) => <BaseSelectTrigger className="bg-white border border-slate-900 text-slate-900" {...props} />;

const LOAN_TYPES = [
  'Business Term Loan',
  'Asset Finance',
  'Invoice Finance',
  'Overdraft',
  'Commercial Mortgage',
  'Equipment Finance',
  'Working Capital Loan',
  'Revolving Credit Facility',
  'Trade Finance',
  'Other'
];

const REPAYMENT_FREQUENCIES = [
  'Monthly',
  'Weekly',
  'Quarterly',
  'Annually'
];

const SECURITY_TYPES = [
  'Unsecured',
  'Personal Guarantee',
  'Asset Security',
  'Property Security',
  'Debenture',
  'Cross Guarantee'
];

const CurrentLending = () => {
  const { user } = useAuth();
  const [currentLendingData, setCurrentLendingData] = useState<CurrentLendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state for new/editing loan
  const [formData, setFormData] = useState<Partial<CurrentLoan>>({
    lender_name: '',
    loan_type: '',
    original_amount: 0,
    outstanding_amount: 0,
    interest_rate: 0,
    monthly_payment: 0,
    start_date: '',
    end_date: '',
    repayment_frequency: 'Monthly',
    status: 'current',
    security_type: 'Unsecured',
    notes: ''
  });

  // Load existing current lending data
  useEffect(() => {
    loadCurrentLendingData();
  }, [user]);

  const loadCurrentLendingData = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // First, check for existing current_lending data
      const { data: currentLendingData, error: currentLendingError } = await getDocument('current_lending', user.uid);
      
      if (currentLendingData) {
        setCurrentLendingData(currentLendingData as CurrentLendingData);
        setIsLoading(false);
        return;
      }

      // If no current_lending data exists, check for sign-up journey data
      const { data: userData, error: userError } = await getDocument('users', user.uid);
      
      if (userData?.currentFunding) {
        // Migrate sign-up journey data to current lending format
        const migratedData = await migrateSignUpDataToCurrentLending(userData.currentFunding);
        if (migratedData) {
          setCurrentLendingData(migratedData);
          setIsLoading(false);
          return;
        }
      }

      // Check businesses collection as fallback
      const { data: businessData, error: businessError } = await getDocument('businesses', user.uid);
      
      if (businessData?.currentFunding) {
        // Migrate sign-up journey data to current lending format
        const migratedData = await migrateSignUpDataToCurrentLending(businessData.currentFunding);
        if (migratedData) {
          setCurrentLendingData(migratedData);
          setIsLoading(false);
          return;
        }
      }

      // Initialize empty data structure if no data found
      const emptyData: CurrentLendingData = {
        user_id: user.uid,
        loans: [],
        total_outstanding: 0,
        total_monthly_payments: 0,
        updated_at: new Date().toISOString()
      };
      setCurrentLendingData(emptyData);
      
    } catch (error) {
      console.error('Error loading current lending data:', error);
      toast.error('Failed to load current lending data');
    } finally {
      setIsLoading(false);
    }
  };

  // Migrate sign-up journey funding data to current lending format
  const migrateSignUpDataToCurrentLending = async (signUpFundingData: any): Promise<CurrentLendingData | null> => {
    if (!signUpFundingData || signUpFundingData.hasCurrentFunding !== 'yes' || !signUpFundingData.fundingDetails) {
      return null;
    }

    try {
      const migratedData = convertSignUpToCurrentLending(signUpFundingData as SignUpCurrentFunding, user!.uid);
      
      if (!migratedData) {
        return null;
      }

      // Save migrated data to current_lending collection
      await updateDocument('current_lending', user!.uid, migratedData);
      
      toast.success(`Successfully migrated ${migratedData.loans.length} funding facility${migratedData.loans.length !== 1 ? 'ies' : ''} from sign-up journey`);
      return migratedData;
      
    } catch (error) {
      console.error('Error migrating sign-up funding data:', error);
      return null;
    }
  };

  const calculateTotals = (loans: CurrentLoan[]) => {
    const activeLoan = loans.filter(loan => loan.status === 'current');
    return {
      total_outstanding: activeLoan.reduce((sum, loan) => sum + loan.outstanding_amount, 0),
      total_monthly_payments: activeLoan.reduce((sum, loan) => sum + loan.monthly_payment, 0)
    };
  };

  const saveLendingData = async (updatedLoans: CurrentLoan[]) => {
    if (!user?.uid || !currentLendingData) return;
    
    const totals = calculateTotals(updatedLoans);
    const updatedData: CurrentLendingData = {
      ...currentLendingData,
      loans: updatedLoans,
      ...totals,
      updated_at: new Date().toISOString()
    };
    
    try {
      await updateDocument('current_lending', user.uid, updatedData);
      setCurrentLendingData(updatedData);
      toast.success('Current lending data saved successfully');
    } catch (error) {
      console.error('Error saving current lending data:', error);
      toast.error('Failed to save current lending data');
    }
  };

  const handleAddLoan = async () => {
    if (!currentLendingData || !formData.lender_name || !formData.loan_type) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const newLoan: CurrentLoan = {
      id: Date.now().toString(),
      lender_name: formData.lender_name!,
      loan_type: formData.loan_type!,
      original_amount: formData.original_amount || 0,
      outstanding_amount: formData.outstanding_amount || 0,
      interest_rate: formData.interest_rate || 0,
      monthly_payment: formData.monthly_payment || 0,
      start_date: formData.start_date || '',
      end_date: formData.end_date || '',
      repayment_frequency: formData.repayment_frequency || 'Monthly',
      status: formData.status || 'current',
      security_type: formData.security_type,
      notes: formData.notes
    };
    
    const updatedLoans = [...currentLendingData.loans, newLoan];
    await saveLendingData(updatedLoans);
    
    // Reset form
    setFormData({
      lender_name: '',
      loan_type: '',
      original_amount: 0,
      outstanding_amount: 0,
      interest_rate: 0,
      monthly_payment: 0,
      start_date: '',
      end_date: '',
      repayment_frequency: 'Monthly',
      status: 'current',
      security_type: 'Unsecured',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEditLoan = async () => {
    if (!currentLendingData || !editingLoanId) return;
    
    const updatedLoans = currentLendingData.loans.map(loan => 
      loan.id === editingLoanId ? { ...loan, ...formData } : loan
    );
    
    await saveLendingData(updatedLoans);
    setEditingLoanId(null);
    setIsEditing(false);
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!currentLendingData) return;
    
    const updatedLoans = currentLendingData.loans.filter(loan => loan.id !== loanId);
    await saveLendingData(updatedLoans);
  };

  const startEditingLoan = (loan: CurrentLoan) => {
    setFormData(loan);
    setEditingLoanId(loan.id);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingLoanId(null);
    setIsEditing(false);
    setShowAddForm(false);
    setFormData({
      lender_name: '',
      loan_type: '',
      original_amount: 0,
      outstanding_amount: 0,
      interest_rate: 0,
      monthly_payment: 0,
      start_date: '',
      end_date: '',
      repayment_frequency: 'Monthly',
      status: 'current',
      security_type: 'Unsecured',
      notes: ''
    });
  };

  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'current':
        return { bgClass: 'bg-green-50', textClass: 'text-green-700', label: 'Current' };
      case 'paid_off':
        return { bgClass: 'bg-gray-50', textClass: 'text-gray-700', label: 'Paid Off' };
      case 'defaulted':
        return { bgClass: 'bg-red-50', textClass: 'text-red-700', label: 'Defaulted' };
      default:
        return { bgClass: 'bg-gray-50', textClass: 'text-gray-700', label: 'Unknown' };
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading current lending data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const activeLoan = currentLendingData?.loans.filter(loan => loan.status === 'current') || [];
  const historicalLoan = currentLendingData?.loans.filter(loan => loan.status !== 'current') || [];
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#212936] mb-2">
                Current Lending
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your existing loans and credit facilities. This information will be used in your funding applications.
              </p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Current Lending
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-[#212936]">
                      {formatCurrency(currentLendingData?.total_outstanding || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                    <PoundSterling className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Payments</p>
                    <p className="text-2xl font-bold text-[#212936]">
                      {formatCurrency(currentLendingData?.total_monthly_payments || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Facilities</p>
                    <p className="text-2xl font-bold text-[#212936]">{activeLoan.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Interest</p>
                    <p className="text-2xl font-bold text-[#212936]">
                      {activeLoan.length > 0 
                        ? `${(activeLoan.reduce((sum, loan) => sum + loan.interest_rate, 0) / activeLoan.length).toFixed(1)}%`
                        : '0.0%'
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Current Lending Facilities</h2>
            </div>

            {/* Add New Loan Form */}
            {showAddForm && (
              <Card className="overflow-hidden transition-all duration-300 transform rounded-xl shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm mb-6">
                {/* Enhanced status indicator bar */}
                <div className="h-3 w-full bg-gradient-to-r from-[#ff8800] to-[#ffaa00]"></div>
                
                {/* Enhanced header */}
                <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#ff8000]/20 to-[#ffaa00]/20 rounded-full opacity-50"></div>
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-[#ff8000]/10 to-[#ffaa00]/10 rounded-full opacity-40"></div>
                  <div className="flex justify-between items-center relative z-10">
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Plus className="h-5 w-5" />
                      Add New Lending Facility
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={cancelEditing} className="text-white hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6 bg-white">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lender_name">Lender Name *</Label>
                      <Input
                        id="lender_name"
                        value={formData.lender_name || ''}
                        onChange={(e) => setFormData({...formData, lender_name: e.target.value})}
                        placeholder="e.g., Santander Business Finance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loan_type">Loan Type *</Label>
                      <Select 
                        value={formData.loan_type || ''} 
                        onValueChange={(value) => setFormData({...formData, loan_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="original_amount">Original Amount</Label>
                      <Input
                        id="original_amount"
                        type="number"
                        value={formData.original_amount || ''}
                        onChange={(e) => setFormData({...formData, original_amount: Number(e.target.value)})}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outstanding_amount">Outstanding Amount</Label>
                      <Input
                        id="outstanding_amount"
                        type="number"
                        value={formData.outstanding_amount || ''}
                        onChange={(e) => setFormData({...formData, outstanding_amount: Number(e.target.value)})}
                        placeholder="35000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                      <Input
                        id="interest_rate"
                        type="number"
                        step="0.1"
                        value={formData.interest_rate || ''}
                        onChange={(e) => setFormData({...formData, interest_rate: Number(e.target.value)})}
                        placeholder="5.9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly_payment">Monthly Payment</Label>
                      <Input
                        id="monthly_payment"
                        type="number"
                        value={formData.monthly_payment || ''}
                        onChange={(e) => setFormData({...formData, monthly_payment: Number(e.target.value)})}
                        placeholder="1850"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="repayment_frequency">Repayment Frequency</Label>
                      <Select 
                        value={formData.repayment_frequency || 'Monthly'} 
                        onValueChange={(value) => setFormData({...formData, repayment_frequency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REPAYMENT_FREQUENCIES.map(freq => (
                            <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="security_type">Security Type</Label>
                      <Select 
                        value={formData.security_type || 'Unsecured'} 
                        onValueChange={(value) => setFormData({...formData, security_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECURITY_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status || 'current'} 
                        onValueChange={(value) => setFormData({...formData, status: value as 'current' | 'paid_off' | 'defaulted'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Current</SelectItem>
                          <SelectItem value="paid_off">Paid Off</SelectItem>
                          <SelectItem value="defaulted">Defaulted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any additional notes about this facility..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button variant="outline" onClick={cancelEditing} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddLoan} 
                      className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Facility
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Loans List */}
            <div className="space-y-6">
              {activeLoan.length === 0 && !showAddForm ? (
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
                    <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">No Current Lending Facilities</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Add your existing loans and credit facilities to help us better understand your financial position for funding applications.
                    </p>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Facility
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                activeLoan.map((loan, index) => (
                  <LoanCard 
                    key={loan.id} 
                    loan={loan} 
                    isEditing={editingLoanId === loan.id}
                    formData={formData}
                    setFormData={setFormData}
                    onEdit={() => startEditingLoan(loan)}
                    onSave={handleEditLoan}
                    onCancel={cancelEditing}
                    onDelete={() => handleDeleteLoan(loan.id)}
                    getStatusStyling={getStatusStyling}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))
              )}
            </div>

            {/* Historical Loans Section */}
            {historicalLoan.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#212936]">Historical Facilities</h2>
                  <span className="text-sm text-gray-500">{historicalLoan.length} facilities</span>
                </div>
                <div className="space-y-4">
                  {historicalLoan.map((loan, index) => (
                    <LoanCard 
                      key={loan.id} 
                      loan={loan} 
                      isHistorical={true}
                      isEditing={editingLoanId === loan.id}
                      formData={formData}
                      setFormData={setFormData}
                      onEdit={() => startEditingLoan(loan)}
                      onSave={handleEditLoan}
                      onCancel={cancelEditing}
                      onDelete={() => handleDeleteLoan(loan.id)}
                      getStatusStyling={getStatusStyling}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

// Loan Card Component
interface LoanCardProps {
  loan: CurrentLoan;
  isHistorical?: boolean;
  isEditing: boolean;
  formData: Partial<CurrentLoan>;
  setFormData: (data: Partial<CurrentLoan>) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  getStatusStyling: (status: string) => any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  isHistorical = false,
  isEditing,
  formData,
  setFormData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  getStatusStyling,
  formatCurrency,
  formatDate
}) => {
  const statusStyling = getStatusStyling(loan.status);

  if (isEditing) {
    return (
      <Card className="overflow-hidden transition-all duration-300 transform rounded-xl shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
        {/* Enhanced status indicator bar */}
        <div className="h-3 w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
        
        {/* Enhanced header */}
        <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full opacity-40"></div>
          <div className="flex justify-between items-center relative z-10">
            <CardTitle className="text-xl text-white flex items-center gap-3">
              <Edit className="h-5 w-5" />
              Edit Lending Facility
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 bg-white">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_lender_name">Lender Name</Label>
              <Input
                id="edit_lender_name"
                value={formData.lender_name || ''}
                onChange={(e) => setFormData({...formData, lender_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_loan_type">Loan Type</Label>
              <Select 
                value={formData.loan_type || ''} 
                onValueChange={(value) => setFormData({...formData, loan_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="edit_original_amount">Original Amount</Label>
              <Input
                id="edit_original_amount"
                type="number"
                value={formData.original_amount || ''}
                onChange={(e) => setFormData({...formData, original_amount: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="edit_outstanding_amount">Outstanding Amount</Label>
              <Input
                id="edit_outstanding_amount"
                type="number"
                value={formData.outstanding_amount || ''}
                onChange={(e) => setFormData({...formData, outstanding_amount: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="edit_interest_rate">Interest Rate (%)</Label>
              <Input
                id="edit_interest_rate"
                type="number"
                step="0.1"
                value={formData.interest_rate || ''}
                onChange={(e) => setFormData({...formData, interest_rate: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="edit_monthly_payment">Monthly Payment</Label>
              <Input
                id="edit_monthly_payment"
                type="number"
                value={formData.monthly_payment || ''}
                onChange={(e) => setFormData({...formData, monthly_payment: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={onCancel} className="border-slate-300 text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
            <Button 
              onClick={onSave} 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${isHistorical ? 'bg-white/60 backdrop-blur-sm border-gray-300/50 opacity-75 hover:opacity-90' : 'bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl'} border transition-all duration-300 transform hover:-translate-y-1 rounded-xl cursor-pointer shadow-lg`}>
      {/* Enhanced status indicator bar with premium gradient */}
      <div className={`h-3 w-full ${
        isHistorical ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
        loan.status === 'current' ? 'bg-gradient-to-r from-green-400 to-green-500' :
        loan.status === 'paid_off' ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
        'bg-gradient-to-r from-red-400 to-red-500'
      }`}></div>
      
      <CardContent className="p-4 md:p-5">
        <div className="space-y-4">
          {/* Enhanced loan header with better styling */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${
              loan.loan_type.includes('Asset') ? 'bg-gradient-to-br from-purple-100 to-purple-200' :
              loan.loan_type.includes('Term') ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
              loan.loan_type.includes('Overdraft') ? 'bg-gradient-to-br from-orange-100 to-orange-200' :
              'bg-gradient-to-br from-green-100 to-green-200'
            }`}>
              <Building2 className={`w-8 h-8 ${
                loan.loan_type.includes('Asset') ? 'text-purple-600' :
                loan.loan_type.includes('Term') ? 'text-blue-600' :
                loan.loan_type.includes('Overdraft') ? 'text-orange-600' :
                'text-green-600'
              }`} />
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-[#212936]">{loan.loan_type}</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${statusStyling.bgClass} ${statusStyling.textClass}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    loan.status === 'current' ? 'bg-green-500' :
                    loan.status === 'paid_off' ? 'bg-gray-500' :
                    'bg-red-500'
                  }`}></div>
                  {statusStyling.label}
                </span>
              </div>
              <p className="text-gray-600 font-medium">{loan.lender_name}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(loan.start_date)} - {formatDate(loan.end_date)}
                </span>
                <span className="text-sm text-gray-500">{loan.security_type}</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced loan details in premium card layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-2">
                <PoundSterling className="h-5 w-5 text-slate-600 group-hover:text-slate-700 transition-colors" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xs text-slate-600 mb-1 font-medium">Original Amount</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(loan.original_amount)}</p>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-2">
                <PoundSterling className="h-5 w-5 text-slate-600 group-hover:text-slate-700 transition-colors" />
                <AlertTriangle className={`h-4 w-4 ${loan.outstanding_amount > 0 ? 'text-amber-500' : 'text-green-500'}`} />
              </div>
              <p className="text-xs text-slate-600 mb-1 font-medium">Outstanding</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(loan.outstanding_amount)}</p>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-2">
                <Percent className="h-5 w-5 text-slate-600 group-hover:text-slate-700 transition-colors" />
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xs text-slate-600 mb-1 font-medium">Interest Rate</p>
              <p className="text-lg font-bold text-slate-900">{loan.interest_rate}%</p>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-slate-600 group-hover:text-slate-700 transition-colors" />
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-xs text-slate-600 mb-1 font-medium">{loan.repayment_frequency} Payment</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(loan.monthly_payment)}</p>
            </div>
          </div>

          {/* Action buttons - now properly aligned */}
          {!isHistorical && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button 
                onClick={onEdit}
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 py-2"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Facility
              </Button>
              
              <Button 
                onClick={onDelete}
                size="sm"
                className="flex-1 bg-[#2a3441] hover:bg-[#1f2937] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 py-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentLending;
