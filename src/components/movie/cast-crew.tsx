"use client";

import Image from "next/image";

interface CastCredit {
  id: number;
  name: string;
  slug: string;
  profileUrl: string | null;
  character: string | null;
  creditOrder: number | null;
}

interface CrewCredit {
  id: number;
  name: string;
  slug: string;
  profileUrl: string | null;
  job: string | null;
  department: string | null;
}

export function CastCrew({ credits }: { credits: { cast: CastCredit[]; crew: CrewCredit[] } }) {
  const { cast, crew } = credits;

  if (!cast.length && !crew.length) return null;

  return (
    <section className="space-y-6">
      {cast.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Cast</h2>
          <div className="flex flex-wrap gap-4">
            {cast.map((person) => (
              <div key={person.id} className="flex flex-col items-center gap-2 w-24">
                <div className="relative size-16 overflow-hidden rounded-full bg-muted">
                  {person.profileUrl ? (
                    <Image
                      src={person.profileUrl}
                      alt={person.name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="object-cover size-full"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-1 text-center">{person.name}</p>
                {person.character && (
                  <p className="text-xs text-muted-foreground line-clamp-1 text-center">{person.character}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {crew.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Crew</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crew.map((person) => (
              <div key={person.id} className="flex flex-col items-center gap-2 w-24">
                <div className="relative size-16 overflow-hidden rounded-full bg-muted">
                  {person.profileUrl ? (
                    <Image
                      src={person.profileUrl}
                      alt={person.name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="object-cover size-full"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-1 text-center">{person.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 text-center">
                  {person.job || person.department || "—"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
