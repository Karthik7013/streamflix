import Image from "next/image";

const MOVIE_POSTERS = [
  "https://media-cache.cinematerial.com/p/500x/ctpnz4mq/interstellar-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/hua9fu5l/supergirl-latvian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/sikn4o3p/peddi-indian-movie-poster.jpg",
  "https://cdn.cinematerial.com/p/297x/wrilasnm/black-widow-movie-poster-md.jpg",
  "https://media-cache.cinematerial.com/p/500x/a9nltnsr/lucy-french-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/fvj5k53e/ray-gunn-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/nwu21mgo/evil-dead-burn-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/gc4ijscp/street-fighter-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/qmxnqgqr/the-paradise-indian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/ccvoqor3/the-odyssey-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/jcs0iccd/ramayana-part-1-indian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/bsqml1pb/couple-friendly-indian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/hgvfrmfu/the-odyssey-movie-poster.jpg"
];

interface PosterCardProps {
  url: string;
  index: number;
  priority?: boolean;
}

const PosterCard = ({ url, index, priority }: PosterCardProps) => (
  <div key={index} className="relative aspect-2/3 w-full rounded-xl overflow-hidden border border-white/5 shadow-2xl transition-transform duration-500 bg-muted/20">
    <Image
      src={url}
      alt=""
      fill
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      sizes="(max-width: 768px) 20vw, 10vw"
      className="object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
  </div>
);

interface PosterGridProps {
  count?: number;
}

export default function PosterGrid({ count = 40 }: PosterGridProps) {
  return (
    <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-35 rotate-z-20 skew-x-[-10deg]">
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 sm:gap-3 p-4 animate-infinite-scroll">
        {[...Array(count)].map((_, i) => (
          <PosterCard
            key={i}
            url={MOVIE_POSTERS[i % MOVIE_POSTERS.length]}
            index={i}
            priority={i < 4}
          />
        ))}
      </div>
    </div>
  );
}