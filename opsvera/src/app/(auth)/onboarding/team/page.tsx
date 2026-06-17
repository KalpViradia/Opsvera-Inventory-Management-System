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
import { Input } from "@/components/ui/input";
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
import { inviteTeamMembers } from "../actions";
import {
  Users,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Mail,
} from "lucide-react";
import { ROLE_LABELS, ROLES } from "@/constants/roles";

interface Invite {
  email: string;
  role: string;
}

const steps = [
  { label: "Company", step: 1 },
  { label: "Team", step: 2 },
  { label: "Preferences", step: 3 },
];

const INVITE_ROLES = [
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
  { value: ROLES.MANAGER, label: ROLE_LABELS[ROLES.MANAGER] },
  { value: ROLES.STAFF, label: ROLE_LABELS[ROLES.STAFF] },
  { value: ROLES.VIEWER, label: ROLE_LABELS[ROLES.VIEWER] },
];

export default function InviteTeamPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([
    { email: "", role: "staff" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addInvite() {
    setInvites([...invites, { email: "", role: "staff" }]);
  }

  function removeInvite(index: number) {
    setInvites(invites.filter((_, i) => i !== index));
  }

  function updateInvite(index: number, field: keyof Invite, value: string) {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    setInvites(updated);
  }

  async function handleContinue() {
    setIsSubmitting(true);
    try {
      // Filter out empty emails
      const validInvites = invites.filter((inv) => inv.email.trim() !== "");
      if (validInvites.length > 0) {
        await inviteTeamMembers(validInvites);
      }
      router.push("/onboarding/preferences");
    } catch {
      // Continue even if invites fail — they're optional
      router.push("/onboarding/preferences");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    router.push("/onboarding/preferences");
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
                  s.step < 2
                    ? "bg-primary text-primary-foreground"
                    : s.step === 2
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s.step < 2 ? <Check className="w-4 h-4" /> : s.step}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  s.step === 2 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-colors ${
                  s.step < 2 ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full shadow-lg border-0 bg-card">
        <CardHeader className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Invite your team
          </CardTitle>
          <CardDescription className="text-base">
            Opsvera works best when your whole team is on board. You can always
            do this later from Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invites.map((invite, index) => (
            <div
              key={index}
              className="flex items-start gap-2"
            >
              <div className="flex-1 space-y-1">
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">
                    Email
                  </Label>
                )}
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={invite.email}
                    onChange={(e) =>
                      updateInvite(index, "email", e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-32 space-y-1">
                {index === 0 && (
                  <Label className="text-xs text-muted-foreground">
                    Role
                  </Label>
                )}
                <Select
                  value={invite.role}
                  onValueChange={(val) => updateInvite(index, "role", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {invites.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`shrink-0 text-muted-foreground hover:text-destructive ${index === 0 ? "mt-5" : ""}`}
                  onClick={() => removeInvite(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="text-sm h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={addInvite}
          >
            <Plus className="w-3.5 h-3.5" />
            Add another
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/onboarding/company")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
          <Button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
