import { useSyncExternalStore } from "react";
import { Appearance, useColorScheme } from "react-native";
import { colors, darkColors, type ColorPalette } from "./tokens";

// react-native-web's Appearance has no setColorScheme (it's wired straight to the OS media query),
// so a toggle driven only by Appearance.setColorScheme is a no-op in `expo start --web` — the only way
// this app is currently verified (see client/CLAUDE.md). This module keeps its own override on top of
// the system scheme via useSyncExternalStore, so the toggle works the same on web and native. It also
// still calls Appearance.setColorScheme where available so native call sites that read system scheme
// directly stay in sync. No persistence lib is installed, so the override resets on reload/relaunch.
type Scheme = "light" | "dark";

let override: Scheme | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getOverrideSnapshot(): Scheme | null {
  return override;
}

export function setThemeOverride(scheme: Scheme) {
  override = scheme;
  if (typeof Appearance.setColorScheme === "function") {
    Appearance.setColorScheme(scheme);
  }
  notify();
}

function useScheme(): Scheme {
  const systemScheme = useColorScheme();
  const overrideScheme = useSyncExternalStore(subscribe, getOverrideSnapshot);
  return (overrideScheme ?? systemScheme) === "dark" ? "dark" : "light";
}

export function useColors(): ColorPalette {
  return useScheme() === "dark" ? darkColors : colors;
}

export function useIsDark(): boolean {
  return useScheme() === "dark";
}
