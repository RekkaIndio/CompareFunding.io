import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "../../../components/ui/form";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../../components/ui/card";
import { Checkbox } from "../../../components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";

interface AdditionalDetailsCardProps {
  form: UseFormReturn<any>;
}

export const AdditionalDetailsCard = ({ form }: AdditionalDetailsCardProps) => {
  return (
    <Card className="relative overflow-hidden bg-white hover:shadow-2xl border transition-all duration-300 transform hover:-translate-y-1 border-slate-200/80 hover:border-slate-300 rounded-xl shadow-lg">
      {/* Premium status indicator bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
      
      <CardHeader className="pb-6 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-t-lg">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-full p-2 shadow-lg">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          Additional Details
        </CardTitle>
        <CardDescription className="text-sm text-slate-300">
          These details may affect your matching with certain lenders and improve your application strength
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        <FormField
          control={form.control}
          name="is_secured"
          render={({ field }) => (
            <FormItem className="group">
              <div className="flex flex-row items-start space-x-4 space-y-0 rounded-xl border-2 border-slate-200 p-5 hover:border-[#ff8000] hover:bg-gradient-to-br hover:from-slate-50 hover:to-orange-50 transition-all duration-200 hover:shadow-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-2 border-slate-300 data-[state=checked]:bg-[#ff8000] data-[state=checked]:border-[#ff8000] h-5 w-5 rounded"
                  />
                </FormControl>
                <div className="space-y-2 leading-none flex-1">
                  <FormLabel className="text-base font-semibold text-[#212936] cursor-pointer group-hover:text-[#ff8000] transition-colors">
                    Secured Loan
                  </FormLabel>
                  <FormDescription className="text-slate-600 text-sm leading-relaxed">
                    I'm willing to offer business assets as security for this loan. This typically results in better rates and terms.
                  </FormDescription>
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                    May improve approval chances
                  </div>
                </div>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="has_personal_guarantee"
          render={({ field }) => (
            <FormItem className="group">
              <div className="flex flex-row items-start space-x-4 space-y-0 rounded-xl border-2 border-slate-200 p-5 hover:border-[#ff8000] hover:bg-gradient-to-br hover:from-slate-50 hover:to-orange-50 transition-all duration-200 hover:shadow-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-2 border-slate-300 data-[state=checked]:bg-[#ff8000] data-[state=checked]:border-[#ff8000] h-5 w-5 rounded"
                  />
                </FormControl>
                <div className="space-y-2 leading-none flex-1">
                  <FormLabel className="text-base font-semibold text-[#212936] cursor-pointer group-hover:text-[#ff8000] transition-colors">
                    Personal Guarantee
                  </FormLabel>
                  <FormDescription className="text-slate-600 text-sm leading-relaxed">
                    I'm willing to provide a personal guarantee for this loan. This shows strong commitment to repayment.
                  </FormDescription>
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                    Demonstrates commitment
                  </div>
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* Enhanced information card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2 shadow-lg">
              <svg className="h-4 w-4 text-[#ff8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#212936] text-sm mb-1">Why provide additional details?</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lenders often offer better terms for secured loans and personal guarantees as they reduce risk. 
                These options can significantly improve your chances of approval and potentially lower interest rates.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
