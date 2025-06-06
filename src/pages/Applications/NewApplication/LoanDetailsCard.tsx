import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../components/ui/form";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { BadgePoundSterling, Calendar, Target, FileText, TrendingUp, DollarSign } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { loanTypeOptions, loanTermOptions, loanPurposeOptions } from "./constants";

interface LoanDetailsCardProps {
  form: UseFormReturn<any>;
}

export const LoanDetailsCard = ({ form }: LoanDetailsCardProps) => {
  return (
    <Card className="relative overflow-hidden bg-white hover:shadow-2xl border transition-all duration-300 transform hover:-translate-y-1 border-slate-200/80 hover:border-slate-300 rounded-xl shadow-lg">
      {/* Premium status indicator bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#ff8000] to-[#212936]"></div>
      
      <CardHeader className="pb-6 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-t-lg">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-full p-2 shadow-lg">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          Loan Details
        </CardTitle>
        <CardDescription className="text-sm text-slate-300">
          Provide comprehensive information about your funding requirements for optimal lender matching
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        <FormField
          control={form.control}
          name="loan_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#212936] font-semibold text-base flex items-center gap-2">
                <BadgePoundSterling className="h-4 w-4 text-[#ff8000]" />
                Loan Amount (£) *
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <BadgePoundSterling className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#212936] group-focus-within:text-[#ff8000] transition-colors" />
                  <Input 
                    className="pl-12 h-12 bg-white border-2 border-slate-200 text-[#212936] rounded-xl focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] hover:border-slate-300 transition-all duration-200 text-lg font-medium" 
                    {...field} 
                    type="number" 
                    min="1000"
                    placeholder="25,000"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-slate-600 text-sm flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-[#ff8000] rounded-full"></div>
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
                <FormLabel className="text-[#212936] font-semibold text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#ff8000]" />
                  Loan Term *
                </FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value.toString()}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 bg-white border-2 border-slate-200 text-[#212936] rounded-xl focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] hover:border-slate-300 transition-all duration-200">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-2 border-slate-200 rounded-xl shadow-xl">
                    {loanTermOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value.toString()}
                        className="text-[#212936] data-[highlighted]:bg-[#ff8000]/10 data-[highlighted]:text-[#ff8000] py-3"
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
                <FormLabel className="text-[#212936] font-semibold text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#ff8000]" />
                  Loan Type *
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 bg-white border-2 border-slate-200 text-[#212936] rounded-xl focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] hover:border-slate-300 transition-all duration-200">
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-2 border-slate-200 rounded-xl shadow-xl">
                    {loanTypeOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-[#212936] data-[highlighted]:bg-[#ff8000]/10 data-[highlighted]:text-[#ff8000] py-3"
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
              <FormLabel className="text-[#212936] font-semibold text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-[#ff8000]" />
                Loan Purpose Category *
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-12 bg-white border-2 border-slate-200 text-[#212936] rounded-xl focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] hover:border-slate-300 transition-all duration-200">
                    <SelectValue placeholder="Select purpose category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-2 border-slate-200 rounded-xl shadow-xl">
                  {loanPurposeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-[#212936] data-[highlighted]:bg-[#ff8000]/10 data-[highlighted]:text-[#ff8000] py-3"
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
              <FormLabel className="text-[#212936] font-semibold text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#ff8000]" />
                Purpose Description *
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please provide detailed information about how you intend to use the funds. Include specific goals, timelines, and expected outcomes..." 
                  className="resize-none min-h-[120px] bg-white border-2 border-slate-200 text-[#212936] rounded-xl focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] placeholder:text-slate-400 hover:border-slate-300 transition-all duration-200 p-4"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-slate-600 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 bg-[#ff8000] rounded-full mt-2 flex-shrink-0"></div>
                  <span>A detailed explanation helps lenders better understand your funding needs and improves your chances of approval with better terms</span>
                </div>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enhanced tip card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2 shadow-lg">
              <svg className="h-4 w-4 text-[#ff8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#212936] text-sm mb-1">Pro Tip</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Be specific and honest about your funding needs. Lenders appreciate transparency and detailed business plans. 
                Consider mentioning expected ROI, market opportunities, and how the funding will drive growth.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
