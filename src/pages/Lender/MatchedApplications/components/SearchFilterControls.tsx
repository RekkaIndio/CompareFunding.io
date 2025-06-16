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
      <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#ff8000]" />
          <Input
            placeholder="Search applications..."
            className="pl-9 bg-white text-slate-900 border-slate-200 focus-visible:ring-[#212936] hover:border-[#212936]/20 placeholder:text-slate-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center w-full lg:flex-1">
          <div className="text-sm font-medium text-white whitespace-nowrap">Filter by status:</div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full flex-1">
            <TabsList className="bg-slate-100 border border-slate-200 w-full grid grid-cols-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="submitted" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">New</TabsTrigger>
              <TabsTrigger value="matched" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">Active</TabsTrigger>
              <TabsTrigger value="declined" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">Declined</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
          
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleSort('loan_amount')} className="border-slate-300 text-white hover:text-slate-900">
            <PoundSterling className="h-3.5 w-3.5 mr-1" />
            Amount
            <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder.field === 'loan_amount' ? 'opacity-100' : 'opacity-40'}`} />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => handleSort('created_at')} className="border-slate-300 text-white hover:text-slate-900">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Date
            <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder.field === 'created_at' ? 'opacity-100' : 'opacity-40'}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterControls;
