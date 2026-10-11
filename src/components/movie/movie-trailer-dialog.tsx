"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"

interface TrailerDialogProps {
  url: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrailerDialog({ url, open, onOpenChange }: TrailerDialogProps) {
  if (!url) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
        <div className="relative aspect-video w-full">
          <iframe
            src={`${url}?autoplay=1&rel=0`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Trailer"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
