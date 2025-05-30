import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "../../../components/ui/form";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../../components/ui/card";
import { Checkbox } from "../../../components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";

interface AdditionalDetailsCardProps {
  form: UseFormReturn<any>;
}

export const AdditionalDetailsCard = ({ form }: AdditionalDetailsCardProps) => {
  return (
    <Card className="bg-white shadow-sm hover:shadow transition-shadow h-full border border-gray-100">
      <CardHeader className="pb-4 bg-[#1c2127] rounded-t-lg">
        <CardTitle className="text-lg font-semibold text-white">Additional Details</CardTitle>
        <CardDescription className="text-sm text-gray-300">
          These details may affect your matching with certain lenders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <FormField
          control={form.control}
          name="is_secured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-gray-300 text-blue-600"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base text-[#1c2127]">
                  Secured Loan
                </FormLabel>
                <FormDescription className="text-[#1c2127]/70">
                  I'm willing to offer business assets as security for this loan
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="has_personal_guarantee"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base">
                  Personal Guarantee
                </FormLabel>
                <FormDescription>
                  I'm willing to provide a personal guarantee for this loan
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
