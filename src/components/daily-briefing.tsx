import { Quote } from "lucide-react";

import { currentUser } from "@/lib/auth";

const JAKARTA_LAT = -6.2088;
const JAKARTA_LON = 106.8456;

type Weather = {
  temp: number;
  description: string;
  icon: string;
};

type DailyQuote = {
  content: string;
  author: string;
};

const FALLBACK_QUOTES: DailyQuote[] = [
  { content: "Premature optimization is the root of all evil.", author: "Donald Knuth" },
  { content: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { content: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { content: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { content: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { content: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { content: "Programs must be written for people to read.", author: "Harold Abelson" },
];

async function fetchWeather(): Promise<Weather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAKARTA_LAT}&longitude=${JAKARTA_LON}&current=temperature_2m,weather_code&timezone=Asia%2FJakarta`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const code = data.current?.weather_code ?? 0;
    const temp = Math.round(data.current?.temperature_2m ?? 0);
    const { description, icon } = describeWeatherCode(code);
    return { temp, description, icon };
  } catch {
    return null;
  }
}

async function fetchQuote(): Promise<DailyQuote> {
  try {
    const res = await fetch("https://zenquotes.io/api/today", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("quote fetch failed");
    const data = (await res.json()) as Array<{ q: string; a: string }>;
    const first = data[0];
    if (!first?.q || !first?.a) throw new Error("malformed quote");
    return { content: first.q, author: first.a };
  } catch {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
  }
}

function describeWeatherCode(code: number): { description: string; icon: string } {
  if (code === 0) return { description: "Clear", icon: "☀️" };
  if (code <= 2) return { description: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { description: "Cloudy", icon: "☁️" };
  if (code === 45 || code === 48) return { description: "Foggy", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { description: "Drizzle", icon: "🌦️" };
  if (code >= 61 && code <= 65) return { description: "Rain", icon: "🌧️" };
  if (code === 66 || code === 67) return { description: "Freezing rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { description: "Snow", icon: "🌨️" };
  if (code >= 80 && code <= 82) return { description: "Heavy rain", icon: "🌧️" };
  if (code === 85 || code === 86) return { description: "Heavy snow", icon: "🌨️" };
  if (code === 95) return { description: "Thunderstorm", icon: "⛈️" };
  if (code >= 96) return { description: "Thunderstorm with hail", icon: "⛈️" };
  return { description: "—", icon: "🌡️" };
}

function getJakartaHour(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(new Date()), 10);
}

function getGreeting(name: string | null): { greeting: string; suffix: string } {
  const hour = getJakartaHour();
  let greeting: string;
  if (hour >= 4 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17 && hour < 21) greeting = "Good evening";
  else greeting = "Good night";
  return name ? { greeting, suffix: `, ${name}` } : { greeting, suffix: "!" };
}

function firstName(value: string): string {
  return value.split(/\s+/)[0]!;
}

export async function DailyBriefing() {
  const user = await currentUser();
  const displayName = user ? firstName(user.name ?? user.username) : null;

  const [weatherResult, quoteResult] = await Promise.allSettled([
    fetchWeather(),
    fetchQuote(),
  ]);

  const weather =
    weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const quote =
    quoteResult.status === "fulfilled"
      ? quoteResult.value
      : FALLBACK_QUOTES[0];

  const { greeting, suffix } = getGreeting(displayName);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 shadow-soft backdrop-blur-sm sm:p-6">
      {/* Glow decorations */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/20 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full blur-2xl"
        style={{ backgroundColor: "hsl(200 95% 60% / 0.15)" }}
      />

      <div className="relative grid gap-4 sm:grid-cols-[auto,1px,1fr] sm:items-center sm:gap-6">
        {/* Greeting + weather */}
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 flex-none place-items-center rounded-2xl border border-border/60 bg-background/60 text-3xl shadow-soft backdrop-blur">
            <span aria-hidden className="animate-float-slow">
              {weather?.icon ?? "👋"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {greeting}
              <span className="text-foreground/80">{suffix}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {weather ? (
                <>
                  <span className="font-medium text-foreground/70">Jakarta</span>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="tabular-nums">{weather.temp}°C</span>
                  <span className="mx-1.5 text-border">·</span>
                  <span>{weather.description}</span>
                </>
              ) : (
                "Have a productive day"
              )}
            </p>
          </div>
        </div>

        {/* Divider on desktop */}
        <div
          aria-hidden
          className="hidden h-12 w-px shrink-0 bg-gradient-to-b from-transparent via-border to-transparent sm:block"
          style={{ justifySelf: "start" }}
        />

        {/* Quote */}
        <blockquote className="relative flex items-start gap-3 text-sm">
          <Quote
            aria-hidden
            className="h-4 w-4 flex-none translate-y-0.5 text-brand/60"
          />
          <div className="min-w-0">
            <p className="text-pretty italic text-muted-foreground">
              {quote.content}
            </p>
            <footer className="mt-1 text-[11px] font-medium uppercase tracking-wider text-foreground/50">
              — {quote.author}
            </footer>
          </div>
        </blockquote>
      </div>
    </section>
  );
}
