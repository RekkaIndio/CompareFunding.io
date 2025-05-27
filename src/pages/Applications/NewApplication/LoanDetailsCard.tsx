import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../components/ui/form";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { BadgePoundSterling } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { loanTypeOptions, loanTermOptions, loanPurposeOptions } from "./constants";

interface LoanDetailsCardProps {
  form: UseFormReturn<any>;
}

export const LoanDetailsCard = ({ form }: LoanDetailsCardProps) => {
  return (
    <Card className="bg-white shadow-sm hover:shadow transition-shadow h-full border border-gray-100">
      <CardHeader className="pb-4 bg-[#1c2127] rounded-t-lg">
        <CardTitle className="text-lg font-semibold text-white">Loan Details</CardTitle>
        <CardDescription className="text-sm text-gray-300">
          Provide information about your funding requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <FormField
          control={form.control}
          name="loan_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#1c2127]">Loan Amount (£) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <BadgePoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1c2127]" />
                  <Input 
                    className="pl-10 bg-white border border-gray-200 text-[#1c2127] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    {...field} 
                    type="number" 
                    min="1000" 
                  />
                </div>
              </FormControl>
              <FormDescription className="text-gray-500">
                Enter an amount between £1,000 and £10,000,000
              </FormDescription>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="loan_term_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Term *</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value.toString()}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="bg-[#f8f9fa] border border-gray-200 text-[#1c2127] rounded-md focus:ring-2 focus:ring-blue-500 h-[42px]">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border border-gray-200">
                    {loanTermOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value.toString()}
                        className="text-[#1c2127] data-[highlighted]:bg-gray-100 data-[highlighted]:text-[#1c2127]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="loan_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Type *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-[#f8f9fa] border border-gray-200 text-[#1c2127] rounded-md focus:ring-2 focus:ring-blue-500 h-[42px]">
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border border-gray-200">
                    {loanTypeOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-[#1c2127] data-[highlighted]:bg-gray-100 data-[highlighted]:text-[#1c2127]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="purpose_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Purpose Category *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-[#f8f9fa] border border-gray-200 text-[#1c2127] rounded-md focus:ring-2 focus:ring-blue-500 h-[42px]">
                    <SelectValue placeholder="Select purpose category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border border-gray-200">
                  {loanPurposeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-[#1c2127] data-[highlighted]:bg-gray-100 data-[highlighted]:text-[#1c2127]"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please provide details about how you intend to use the funds..." 
                  className="resize-none min-h-[100px] bg-white border border-gray-200 text-[#1c2127] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Detailed explanation helps lenders better understand your funding needs
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
