"use client"

interface InternetArchivePlayerProps {
  identifier: string
  className?: string
}

export function InternetArchivePlayer({ identifier, className }: InternetArchivePlayerProps) {

  if (!identifier) return null;

  const embedSrc = `https://archive.org/embed/${getEmbedId(identifier)}`;

  return (
    <iframe
      src={embedSrc}
      className={`${className} border-0`}
      allowFullScreen
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms"
      loading="lazy"
    />
  )
}
