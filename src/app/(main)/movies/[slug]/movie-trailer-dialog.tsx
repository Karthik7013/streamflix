import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TrailerDialogProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrailerDialog({ url, open, onOpenChange }: TrailerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black">
        <div className="aspect-video">
          <iframe
            src={`${url}?autoplay=1`}
            title="Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
