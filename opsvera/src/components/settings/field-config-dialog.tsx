/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomField } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { createCustomFieldSchema } from "@/validations/custom-field";

type FieldFormValues = z.infer<typeof createCustomFieldSchema>;

interface FieldConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: CustomField | null;
  moduleName: "products" | "customers" | "suppliers";
  onSave: (data: FieldFormValues) => Promise<void>;
}

export function FieldConfigDialog({
  open,
  onOpenChange,
  field,
  moduleName,
  onSave,
}: FieldConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionsString, setOptionsString] = useState(
    field?.options ? (field.options as string[]).join(", ") : ""
  );

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(createCustomFieldSchema) as any,
    defaultValues: {
      moduleName,
      fieldName: field?.fieldName || "",
      fieldType: (field?.fieldType as any) || "text",
      isRequired: field?.isRequired || false,
      defaultValue: field?.defaultValue || "",
      placeholder: field?.placeholder || "",
      helpText: field?.helpText || "",
      options: field?.options as string[] | undefined,
      displayOrder: field?.displayOrder || 0,
      isActive: field?.isActive ?? true,
    },
  });

  const fieldType = form.watch("fieldType");

  const handleSubmit = async (data: FieldFormValues) => {
    setIsSubmitting(true);
    try {
      // Process options for dropdown
      if (data.fieldType === "dropdown") {
        data.options = optionsString
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0);
      } else {
        data.options = undefined;
      }
      await onSave(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{field ? "Edit Custom Field" : "Create Custom Field"}</DialogTitle>
          <DialogDescription>
            Add a new field to the {moduleName} module.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fieldName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Warranty Period" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fieldType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text (Short string)</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="dropdown">Dropdown (Select)</SelectItem>
                      <SelectItem value="checkbox">Checkbox (True/False)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fieldType === "dropdown" && (
              <FormItem>
                <FormLabel>Dropdown Options</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Small, Medium, Large"
                    value={optionsString}
                    onChange={(e) => setOptionsString(e.target.value)}
                  />
                </FormControl>
                <FormDescription>Comma separated list of options</FormDescription>
                <FormMessage />
              </FormItem>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placeholder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder</FormLabel>
                    <FormControl>
                      <Input placeholder="Placeholder..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value</FormLabel>
                    <FormControl>
                      <Input placeholder="Default..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="helpText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Text</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Instructions for users filling out this field" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required Field</FormLabel>
                      <FormDescription>User must provide a value</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Visible on forms</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Field"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
