"use client";

import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, ShieldCheck, ShieldAlert, Key } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TwoFactorManager() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const isEnabled = !!user?.twoFactorEnabled;

  const [isLoading, setIsLoading] = useState(false);
  
  // State for enabling flow
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  
  // State for disabling flow
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);

  const handleStartEnable = async () => {
    setIsEnableDialogOpen(true);
  };

  const handleEnableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const payload: any = {};
      if (password) {
        payload.password = password;
      }
      
      const res = await authClient.twoFactor.enable(payload);
      
      if (res.error) {
        toast.error(res.error.message || "Failed to enable 2FA");
        return;
      }
      
      // better-auth returns totpURI and backupCodes
      if (res.data?.totpURI) {
        setTotpURI(res.data.totpURI);
        toast.success("Please scan the QR code to finish setup");
      } else {
        toast.success("2FA enabled successfully");
        setIsEnableDialogOpen(false);
        setPassword("");
        window.location.reload();
      }
    } catch (error) {
      toast.error((error as Error).message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const payload: any = {};
      if (password) {
        payload.password = password;
      }

      const res = await authClient.twoFactor.disable(payload);

      if (res.error) {
        toast.error(res.error.message || "Failed to disable 2FA");
      } else {
        toast.success("2FA disabled successfully");
        setIsDisableDialogOpen(false);
        setPassword("");
        window.location.reload();
      }
    } catch (error) {
      toast.error((error as Error).message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isEnabled ? (
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-300">2FA is Enabled</AlertTitle>
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            Your account is protected with two-factor authentication.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="bg-destructive/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>2FA is Disabled</AlertTitle>
          <AlertDescription>
            Your account is vulnerable. We highly recommend enabling two-factor authentication.
          </AlertDescription>
        </Alert>
      )}

      <div className="pt-4">
        {isEnabled ? (
          <Button variant="destructive" onClick={() => setIsDisableDialogOpen(true)}>
            Disable 2FA
          </Button>
        ) : (
          <Button onClick={handleStartEnable}>
            Enable 2FA
          </Button>
        )}
      </div>

      {/* Enable Dialog */}
      <Dialog open={isEnableDialogOpen} onOpenChange={setIsEnableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {totpURI 
                ? "Scan this QR code with your authenticator app (like Google Authenticator or Authy)." 
                : "Enter your password to continue."}
            </DialogDescription>
          </DialogHeader>

          {totpURI ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={totpURI} size={200} />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                After scanning, your app will start generating codes. 
                You will need these codes to log in from now on.
              </p>
              <Button 
                className="w-full mt-4" 
                onClick={() => {
                  setIsEnableDialogOpen(false);
                  setTotpURI(null);
                  setPassword("");
                  window.location.reload();
                }}
              >
                I have scanned the code
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEnableSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="password">Current Password (Leave blank if you signed in with Google)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEnableDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable 2FA? This will make your account less secure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisableSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Current Password (Leave blank if you signed in with Google)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="disable-password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDisableDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable 2FA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
