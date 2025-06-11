import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Star, X, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { FilterOption } from '@/lib/productFilters';

export type FilterValues = {
  [key: string]: any;
};

type ProductFiltersProps = {
  filters: FilterOption[];
  values: FilterValues;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
};

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  values,
  onChange,
  onClear
}) => {
  const [openFilters, setOpenFilters] = useState<string[]>([]);
  
  const hasActiveFilters = Object.keys(values).some(key => {
    const value = values[key];
    return value !== undefined && value !== null && value !== 'all' &&
           (Array.isArray(value) ? value.length > 0 : value !== '');
  });

  const toggleFilter = (filterKey: string) => {
    setOpenFilters(prev => 
      prev.includes(filterKey) 
        ? prev.filter(key => key !== filterKey)
        : [...prev, filterKey]
    );
  };

  const renderFilter = (filter: FilterOption) => {
    const value = values[filter.key];
    const isOpen = openFilters.includes(filter.key);
    const hasValue = value !== undefined && value !== null && value !== 'all' && 
                    (Array.isArray(value) ? value.length > 0 : value !== '');

    return (
      <Collapsible key={filter.key} open={isOpen} onOpenChange={() => toggleFilter(filter.key)}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-2 h-auto text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-medium text-xs break-words leading-tight">{filter.label}</span>
              {hasValue && (
                <Badge variant="secondary" className="text-xs flex-shrink-0 px-1.5 py-0.5">
                  •
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-2 pb-2">
          <div className="pt-1">
            {renderFilterContent(filter, value)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderFilterContent = (filter: FilterOption, value: any) => {

    switch (filter.type) {
      case 'range':
        const currentValue = Array.isArray(value) ? value : [filter.min || 0, filter.max || 100];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Range</span>
              <div className="text-xs font-medium text-gray-900">
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
          <div className="space-y-1">
            <Select
              value={value || 'all'}
              onValueChange={(newValue) => onChange(filter.key, newValue === 'all' ? '' : newValue)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOption && (
              <div className="text-xs text-gray-600">
                {selectedOption.label}
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Enable</span>
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => onChange(filter.key, checked)}
            />
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: filter.max || 5 }, (_, i) => {
                const starValue = i + 1;
                const isSelected = (value || 0) >= starValue;
                return (
                  <button
                    key={i}
                    onClick={() => onChange(filter.key, isSelected && value === starValue ? 0 : starValue)}
                    className={`p-0.5 rounded transition-colors ${
                      isSelected 
                        ? 'text-yellow-400 hover:text-yellow-500' 
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <Star className="h-3 w-3 fill-current" />
                  </button>
                );
              })}
            </div>
            {value > 0 && (
              <div className="text-xs text-gray-600">
                Min {value}★
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            </div>
            {hasActiveFilters && (
              <Button
                onClick={onClear}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1 mt-2">
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
                } else if (filter.type === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (filter.type === 'rating') {
                  displayValue = `${value}+★`;
                }

                return (
                  <Badge key={key} variant="secondary" className="text-xs px-1.5 py-0.5">
                    {displayValue}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {filters.map(filter => (
            <div key={filter.key} className="px-0.5">
              {renderFilter(filter)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
