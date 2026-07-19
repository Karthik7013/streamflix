"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { moviesApi } from "@/lib/api/movies";
import { logger } from "@/lib/logger";

interface ReportSectionProps {
  movieSlug: string;
}

export function ReportSection({ movieSlug }: ReportSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    setSubmitting(true);
    try {
      await moviesApi.report(movieSlug, description.trim());
      setSubmitted(true);
      setDescription("");
      toast.success("Report submitted. An admin will review it.");
      successTimeoutRef.current = setTimeout(() => { setSubmitted(false); setIsOpen(false); }, 2000);
    } catch (err) {
      logger.error("report-section", "Failed to submit report", err);
      toast.error("Unable to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Report an issue
        </span>
        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., video won't play, audio out of sync, wrong video)..."
            className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={submitting || submitted}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{description.length}/1000</span>
            <button
              type="submit"
              disabled={submitting || submitted || !description.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> Submitting...</>
              ) : submitted ? (
                <><CheckCircle2 className="size-4" /> Submitted</>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
