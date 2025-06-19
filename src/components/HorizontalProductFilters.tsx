import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Star, X, ChevronDown, Filter, Search, SortAsc } from 'lucide-react';
import { FilterOption } from '@/lib/productFilters';

export type FilterValues = {
  [key: string]: any;
};

type HorizontalProductFiltersProps = {
  filters: FilterOption[];
  values: FilterValues;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  lendersCount: number;
  connectedLendersCount?: number;
};

export const HorizontalProductFilters: React.FC<HorizontalProductFiltersProps> = ({
  filters,
  values,
  onChange,
  onClear,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  lendersCount,
  connectedLendersCount = 0
}) => {
  const hasActiveFilters = Object.keys(values).some(key => {
    const value = values[key];
    return value !== undefined && value !== null && value !== 'all' &&
           (Array.isArray(value) ? value.length > 0 : value !== '');
  });

  const renderFilterContent = (filter: FilterOption, value: any) => {
    switch (filter.type) {
      case 'range':
        const currentValue = Array.isArray(value) ? value : [filter.min || 0, filter.max || 100];
        return (
          <div className="space-y-3 p-4 min-w-[280px] bg-gray-900 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Range</span>
              <div className="text-sm font-medium text-white">
                {filter.unit}{currentValue[0].toLocaleString()} - {filter.unit}{currentValue[1].toLocaleString()}
              </div>
            </div>
            <Slider
              value={currentValue}
              onValueChange={(newValue) => onChange(filter.key, newValue)}
              min={filter.min}
              max={filter.max}
              step={filter.step}
              className="w-full"
            />
          </div>
        );

      case 'select':
        const selectedOption = filter.options?.find(opt => opt.value === value);
        return (
          <div className="space-y-2 p-4 min-w-[200px] bg-gray-900 text-white">
            <Select
              value={value || 'all'}
              onValueChange={(newValue) => onChange(filter.key, newValue === 'all' ? '' : newValue)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOption && (
              <div className="text-xs text-gray-300">
                Selected: {selectedOption.label}
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="p-4 min-w-[180px] bg-gray-900 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Enable filter</span>
              <Switch
                checked={value || false}
                onCheckedChange={(checked) => onChange(filter.key, checked)}
              />
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-3 p-4 min-w-[200px] bg-gray-900 text-white">
            <div className="flex items-center gap-1">
              {Array.from({ length: filter.max || 5 }, (_, i) => {
                const starValue = i + 1;
                const isSelected = (value || 0) >= starValue;
                return (
                  <button
                    key={i}
                    onClick={() => onChange(filter.key, isSelected && value === starValue ? 0 : starValue)}
                    className={`p-1 rounded transition-colors ${
                      isSelected 
                        ? 'text-yellow-400 hover:text-yellow-500' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                );
              })}
            </div>
            {value > 0 && (
              <div className="text-xs text-gray-300">
                Minimum {value} star{value !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderFilterButton = (filter: FilterOption) => {
    const value = values[filter.key];
    const hasValue = value !== undefined && value !== null && value !== 'all' && 
                    (Array.isArray(value) ? value.length > 0 : value !== '');

    return (
      <DropdownMenu key={filter.key}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 border transition-colors ${
              hasValue 
                ? 'bg-[#ff8000] text-white border-[#ff8000] hover:bg-[#e6720d] hover:border-[#e6720d]' 
                : 'bg-transparent text-white border-white hover:bg-white hover:text-gray-900'
            }`}
          >
            <span>{filter.label}</span>
            {hasValue && (
              <Badge variant="secondary" className="text-xs ml-1 bg-white/20 text-white border-0">
                •
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="p-0 bg-gray-900 border-gray-700">
          {renderFilterContent(filter, value)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-20 z-40 w-full bg-gray-900 rounded-lg border border-gray-700 shadow-lg p-4 mb-6">
      {/* Search, Sort, and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search lenders..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] text-white placeholder-gray-400 text-sm"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white whitespace-nowrap">Sort by:</label>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] text-sm"
              >
                <option value="interest_rate">Interest Rate</option>
                <option value="amount">Max Amount</option>
                <option value="speed">Processing Speed</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-600 text-blue-100 border-blue-500">
            {lendersCount} Found
          </Badge>
          {hasActiveFilters && (
            <Button
              onClick={onClear}
              variant="ghost"
              size="sm"
              className="text-white hover:text-gray-300 hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>          {/* Filters Section */}
          {filters.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-white" />
                <h3 className="font-semibold text-white">Filters</h3>
                {connectedLendersCount > 0 && (
                  <div className="ml-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-white font-medium">
                        Auto-Connected: {connectedLendersCount}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => renderFilterButton(filter))}
          </div>
          
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-300 mr-2">Active filters:</span>
              {Object.entries(values).map(([key, value]) => {
                if (!value || value === 'all' || (Array.isArray(value) && value.length === 0)) return null;
                
                const filter = filters.find(f => f.key === key);
                if (!filter) return null;

                let displayValue = '';
                if (filter.type === 'range' && Array.isArray(value)) {
                  displayValue = `${filter.unit || ''}${value[0]}-${value[1]}`;
                } else if (filter.type === 'select') {
                  const option = filter.options?.find(o => o.value === value);
                  displayValue = option?.label || value;
                } else if (filter.type === 'rating') {
                  displayValue = `${value}+★`;
                }

                return (
                  <Badge key={key} variant="secondary" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                    {filter.label}: {displayValue}
                  </Badge>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
