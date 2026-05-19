"use client";

import { Cable, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getBackendUrl } from "@/lib/utils";

export function ConnectGoogleCard({ connected }: { connected?: boolean }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent p-2 text-accent-foreground">
            {connected ? <CheckCircle2 className="h-5 w-5" /> : <Cable className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">Google Drive and YouTube access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {connected
                ? "Your channel connection is ready for queue uploads."
                : "Drive import and channel publishing are unavailable until connected."}
            </p>
          </div>
        </div>
        <Button
          variant={connected ? "secondary" : "primary"}
          onClick={() => {
            window.location.href = `${getBackendUrl()}/api/oauth/google/start`;
          }}
        >
          <Cable className="h-4 w-4" />
          {connected ? "Reconnect" : "Connect YouTube"}
        </Button>
      </CardBody>
    </Card>
  );
}
