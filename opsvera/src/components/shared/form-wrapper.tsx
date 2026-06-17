"use client";

import { UseFormReturn, FieldValues, SubmitHandler } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function FormWrapper<T extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Submit",
  isSubmitting = false,
}: FormWrapperProps<T>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {children}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
