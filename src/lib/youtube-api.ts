export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  seekTo: (seconds: number) => void;
  destroy: () => void;
}

export interface YouTubePlayerOptions {
  videoId: string;
  playerVars: Record<string, number | string>;
  events: {
    onReady: (event: { target: YouTubePlayer }) => void;
    onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
    onError: (event: unknown) => void;
  };
}

export interface YouTubeNamespace {
  Player: new (el: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

const API_LOAD_TIMEOUT_MS = 15000;

export function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const win = window as unknown as {
      YT?: YouTubeNamespace;
      onYouTubeIframeAPIReady?: () => void;
    };
    if (win.YT) {
      resolve(win.YT);
      return;
    }
    const timeout = setTimeout(
      () => reject(new Error("YouTube IFrame API load timed out")),
      API_LOAD_TIMEOUT_MS
    );
    const prevReady = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      prevReady?.();
      if (win.YT) resolve(win.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("YouTube IFrame API failed to load"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
