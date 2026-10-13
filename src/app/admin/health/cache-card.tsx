"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2Icon, Trash2 } from "lucide-react";
import { CACHE_FLUSH_SCOPES, useFlushCache } from "@/hooks/use-flush-cache";

export function FlushCacheCard() {
  const [scope, setScope] = useState<string>("home");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const flush = useFlushCache();
  const isAll = scope === "all";

  const openConfirm = useCallback(() => setConfirmOpen(true), []);
  const handleFlush = useCallback(() => {
    flush.mutate(scope, { onSuccess: () => setConfirmOpen(false) });
  }, [flush, scope]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cache management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Clear stale Redis entries (app keys only — rate limits untouched).
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={scope} onValueChange={(v: string | null) => setScope(v ?? "home")}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent className="p-2">
                {CACHE_FLUSH_SCOPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="destructive" onClick={openConfirm} disabled={flush.isPending}>
              {flush.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Flush cache
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>Flush cache</DialogTitle>
          <DialogDescription>
            {isAll
              ? "This clears the entire app cache and will temporarily increase database load. "
              : "This forces fresh database reads for the selected scope. "}
            This action cannot be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleFlush} disabled={flush.isPending}>
              {flush.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Flush
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
