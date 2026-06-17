"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  preferencesSchema,
  type PreferencesInput,
  CURRENCIES,
  TIMEZONES,
} from "@/validations/onboarding";
import { setCompanyPreferences } from "../actions";
import { Settings2, ArrowLeft, Loader2, Check, Sparkles } from "lucide-react";

const steps = [
  { label: "Company", step: 1 },
  { label: "Team", step: 2 },
  { label: "Preferences", step: 3 },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currency: "USD",
      timezone: "UTC",
      fiscalYearStart: 1,
    },
  });

  async function onSubmit(data: PreferencesInput) {
    setIsSubmitting(true);
    setError(null);
    try {
      await setCompanyPreferences(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s.step < 3
                    ? "bg-primary text-primary-foreground"
                    : s.step === 3
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s.step < 3 ? <Check className="w-4 h-4" /> : s.step}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  s.step === 3 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-colors ${
                  s.step < 3 ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full shadow-lg border-0 bg-card">
        <CardHeader className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Settings2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Organization settings
          </CardTitle>
          <CardDescription className="text-base">
            Set your default currency and timezone. You can change these anytime
            in Settings.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <Select
                defaultValue="USD"
                onValueChange={(val) => setValue("currency", val)}
              >
                <SelectTrigger
                  className={errors.currency ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">
                  {errors.currency.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                defaultValue="UTC"
                onValueChange={(val) => setValue("timezone", val)}
              >
                <SelectTrigger
                  className={errors.timezone ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-destructive">
                  {errors.timezone.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/onboarding/team")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Complete Setup
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
