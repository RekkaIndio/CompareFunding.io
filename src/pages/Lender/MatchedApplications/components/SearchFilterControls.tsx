import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ArrowUpDown, PoundSterling, Clock } from 'lucide-react';

interface SearchFilterControlsProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortOrder: { field: string; direction: string };
  handleSort: (field: string) => void;
}

const SearchFilterControls: React.FC<SearchFilterControlsProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  handleSort,
}) => {
  return (
    <div className="mb-8 bg-white backdrop-blur-sm rounded-lg border border-slate-200/50 p-6 shadow-lg">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#ff8000]" />
          <Input
            placeholder="Search applications..."
            className="pl-9 border-slate-200 focus-visible:ring-[#212936] hover:border-[#212936]/20"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="text-sm font-medium text-[#212936]">Filter by status:</div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList className="bg-slate-100 border border-slate-200">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="submitted" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">New</TabsTrigger>
              <TabsTrigger value="matched" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">Active</TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">With Offers</TabsTrigger>
              <TabsTrigger value="declined" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">Declined</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 ml-0 md:ml-4 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={() => handleSort('loan_amount')} className="border-slate-300">
              <PoundSterling className="h-3.5 w-3.5 mr-1" />
              Amount
              <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder.field === 'loan_amount' ? 'opacity-100' : 'opacity-40'}`} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => handleSort('created_at')} className="border-slate-300">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Date
              <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder.field === 'created_at' ? 'opacity-100' : 'opacity-40'}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterControls;
