/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { CustomField } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DynamicFieldRendererProps {
  fields: CustomField[];
  initialValues?: Record<string, string>;
  onChange: (values: Record<string, string>, isValid: boolean) => void;
}

export function DynamicFieldRenderer({ fields, initialValues = {}, onChange }: DynamicFieldRendererProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize defaults
  useEffect(() => {
    const newValues = { ...values };
    let changed = false;

    fields.forEach((field) => {
      if (newValues[field.id] === undefined && field.defaultValue !== null) {
        newValues[field.id] = field.defaultValue;
        changed = true;
      }
    });

    if (changed) {
      setValues(newValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // Validate on change
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    fields.forEach((field) => {
      const val = values[field.id];
      if (field.isRequired && (!val || val.trim() === "")) {
        // Special case for checkbox
        if (field.fieldType === "checkbox" && val !== "true") {
          // If required, a checkbox must be true? Usually checkbox required means must be checked (like T&C).
          // We'll assume checkbox required = must be checked.
          newErrors[field.id] = "Must be checked";
          valid = false;
        } else if (field.fieldType !== "checkbox") {
          newErrors[field.id] = "This field is required";
          valid = false;
        }
      }
    });

    setErrors(newErrors);
    onChange(values, valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, fields]);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4">
      {fields
        .filter((f) => f.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((field) => {
          const val = values[field.id] || "";
          const error = errors[field.id];

          return (
            <div key={field.id} className="space-y-2">
              {field.fieldType !== "checkbox" && (
                <Label htmlFor={field.id}>
                  {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
                </Label>
              )}

              {field.fieldType === "text" && (
                <Input
                  id={field.id}
                  placeholder={field.placeholder || ""}
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={error ? "border-red-500" : ""}
                />
              )}

              {field.fieldType === "number" && (
                <Input
                  id={field.id}
                  type="number" onFocus={(e) => e.target.select()}
                  placeholder={field.placeholder || ""}
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={error ? "border-red-500" : ""}
                />
              )}

              {field.fieldType === "date" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !val && "text-muted-foreground",
                        error && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {val ? format(parseISO(val), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={val ? parseISO(val) : undefined}
                      onSelect={(date) => handleChange(field.id, date ? format(date, "yyyy-MM-dd") : "")}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {field.fieldType === "dropdown" && field.options && (
                <Select value={val} onValueChange={(v) => handleChange(field.id, v)}>
                  <SelectTrigger className={error ? "border-red-500" : ""}>
                    <SelectValue placeholder={field.placeholder || "Select option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options as string[]).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.fieldType === "checkbox" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={val === "true"}
                    onCheckedChange={(c) => handleChange(field.id, c ? "true" : "false")}
                  />
                  <Label htmlFor={field.id}>
                    {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
                  </Label>
                </div>
              )}

              {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          );
        })}
    </div>
  );
}
