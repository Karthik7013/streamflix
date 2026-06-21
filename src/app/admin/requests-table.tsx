"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, PlusIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react";

interface RequestUser {
  name: string;
  email: string;
}

interface MovieRequest {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  status: "pending" | "fulfilled";
  createdAt: string;
  updatedAt: string;
  user: RequestUser;
}

const RequestRow = memo(function RequestRow({
  req,
  onFulfill,
  onOpenCreateMovie,
  onSetDeleteTarget,
}: {
  req: MovieRequest;
  onFulfill: (r: MovieRequest) => void;
  onOpenCreateMovie: (r: MovieRequest) => void;
  onSetDeleteTarget: (r: MovieRequest | null) => void;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3 font-medium">{req.title}</td>
      <td className="px-4 py-3 text-sm">
        <div>{req.user.name}</div>
        <div className="text-xs text-muted-foreground">{req.user.email}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
        {req.description || "\u2014"}
      </td>
      <td className="px-4 py-3 text-sm">
        {req.externalLink ? (
          <a href={req.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Link <ExternalLinkIcon className="size-3" />
          </a>
        ) : "\u2014"}
      </td>
      <td className="px-4 py-3">
        <Badge variant={req.status === "fulfilled" ? "default" : "secondary"}>{req.status}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(req.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {req.status === "pending" && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onFulfill(req)} title="Mark as fulfilled" className="size-8">
                <CheckIcon className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenCreateMovie(req)} title="Create movie from request" className="size-8">
                <PlusIcon className="size-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => onSetDeleteTarget(req)} title="Delete request" className="size-8">
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

export default function RequestsTable({
  requests,
  loading,
  onFulfill,
  onOpenCreateMovie,
  onSetDeleteTarget,
}: {
  requests: MovieRequest[];
  loading: boolean;
  onFulfill: (r: MovieRequest) => void;
  onOpenCreateMovie: (r: MovieRequest) => void;
  onSetDeleteTarget: (r: MovieRequest | null) => void;
}) {
  if (loading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="size-6 rounded shrink-0" />
            <Skeleton className="size-8 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No requests found.</div>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b text-left text-sm text-muted-foreground">
          <th className="px-4 py-3 font-medium">Title</th>
          <th className="px-4 py-3 font-medium">Requester</th>
          <th className="px-4 py-3 font-medium">Description</th>
          <th className="px-4 py-3 font-medium">Link</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Date</th>
          <th className="px-4 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <RequestRow key={req.id} req={req} onFulfill={onFulfill} onOpenCreateMovie={onOpenCreateMovie} onSetDeleteTarget={onSetDeleteTarget} />
        ))}
      </tbody>
    </table>
  );
}
