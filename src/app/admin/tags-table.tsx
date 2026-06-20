"use client";

import { memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon, PlusIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

interface Tag {
  id: number;
  name: string;
  movieCount?: number;
}

const TagRow = memo(function TagRow({
  tag,
  editingId,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  deleteTarget,
  onDeleteTargetChange,
  onDelete,
  editInputRef,
  disabled,
}: {
  tag: Tag;
  editingId: number | null;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEdit: (tag: Tag) => void;
  deleteTarget: Tag | null;
  onDeleteTargetChange: (tag: Tag | null) => void;
  onDelete: () => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3">
        {editingId === tag.id ? (
          <div className="flex items-center gap-2">
            <Input ref={editInputRef as React.Ref<HTMLInputElement>} value={editingName} onChange={(e) => onEditingNameChange(e.target.value)} className="h-8 max-w-xs"
              onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }} />
            <Button variant="ghost" size="icon-sm" onClick={onSaveEdit} disabled={!editingName.trim()}>
              <CheckIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onCancelEdit}>
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ) : (
          <span className="font-medium">{tag.name}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary">{tag.movieCount ?? 0}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(tag)} disabled={disabled}>
            <PencilIcon className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger onClick={() => onDeleteTargetChange(tag)}>
              <Trash2Icon className="size-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex justify-end gap-2 mt-6">
                <AlertDialogClose render={<Button variant="outline">Cancel</Button>} onClick={() => onDeleteTargetChange(null)} />
                <Button variant="destructive" onClick={onDelete}>Delete</Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
});

const CreateTagRow = memo(function CreateTagRow({
  value,
  onChange,
  onCreate,
  onCancel,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onCreate: () => void;
  onCancel: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <tr className="border-b bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Input ref={inputRef as React.Ref<HTMLInputElement>} value={value} onChange={(e) => onChange(e.target.value)} placeholder="New tag name..." className="h-8 max-w-xs"
            onKeyDown={(e) => { if (e.key === "Enter") onCreate(); if (e.key === "Escape") onCancel(); }} />
          <Button variant="ghost" size="icon-sm" onClick={onCreate} disabled={!value.trim()}>
            <CheckIcon className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
      <td className="px-4 py-3" />
    </tr>
  );
});

export default function TagsTable({
  tags,
  loading,
  creating,
  newTagName,
  onNewTagNameChange,
  onCreate,
  onCancelCreate,
  editingId,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  deleteTarget,
  onDeleteTargetChange,
  onDelete,
  editInputRef,
  newInputRef,
  disabled,
}: {
  tags: Tag[];
  loading: boolean;
  creating: boolean;
  newTagName: string;
  onNewTagNameChange: (v: string) => void;
  onCreate: () => void;
  onCancelCreate: () => void;
  editingId: number | null;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEdit: (tag: Tag) => void;
  deleteTarget: Tag | null;
  onDeleteTargetChange: (tag: Tag | null) => void;
  onDelete: () => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  newInputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
}) {
  if (loading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12 shrink-0" />
            <div className="flex-1" />
            <Skeleton className="size-8 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (tags.length === 0 && !creating) {
    return <div className="py-12 text-center text-muted-foreground">No tags found.</div>;
  }

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Movie Count</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {creating && (
            <CreateTagRow value={newTagName} onChange={onNewTagNameChange} onCreate={onCreate} onCancel={onCancelCreate} inputRef={newInputRef} />
          )}
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} editingId={editingId} editingName={editingName}
              onEditingNameChange={onEditingNameChange} onSaveEdit={onSaveEdit} onCancelEdit={onCancelEdit}
              onEdit={onEdit} deleteTarget={deleteTarget} onDeleteTargetChange={onDeleteTargetChange}
              onDelete={onDelete} editInputRef={editInputRef} disabled={disabled} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
