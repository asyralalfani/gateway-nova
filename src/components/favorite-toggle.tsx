"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "gateway-nova.favorites";
const CHANGE_EVENT = "favorites:changed";

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* ignore quota */
  }
}

export function toggleFavorite(id: string): string[] {
  const current = loadFavorites();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  saveFavorites(next);
  return next;
}

export function useFavorites(): string[] {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
    const onChange = () => setFavorites(loadFavorites());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return favorites;
}

type Props = {
  toolId: string;
  className?: string;
};

export function FavoriteToggle({ toolId, className }: Props) {
  const favorites = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFavorite = mounted && favorites.includes(toolId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(toolId);
      }}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      className={`group/star relative grid h-7 w-7 flex-none place-items-center rounded-md text-muted-foreground transition-all hover:scale-110 hover:bg-muted hover:text-amber-500 ${className ?? ""}`}
    >
      <Star
        className={`h-3.5 w-3.5 transition-all ${
          isFavorite
            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgb(251_191_36_/_0.6)]"
            : ""
        }`}
      />
    </button>
  );
}
