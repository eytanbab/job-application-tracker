"use client";

import { SignInButton, useClerk } from "@clerk/nextjs";
import { UserCog, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileCard({ signedIn }: { signedIn: boolean }) {
  const clerk = useClerk();

  return (
    <Card className="gap-4 rounded-xl border-border/30 p-5">
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>
          {signedIn
            ? "Update your name, email address, password and connected accounts."
            : "You're using a guest workspace. Your applications are saved in this browser only, and guest data is deleted after 90 days without activity."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {signedIn ? (
          <Button variant="outline" onClick={() => clerk.openUserProfile()}>
            <UserCog />
            Manage profile
          </Button>
        ) : (
          <SignInButton mode="modal">
            <Button>
              <UserRound />
              Sign in to keep your data
            </Button>
          </SignInButton>
        )}
      </CardContent>
    </Card>
  );
}
