"use client";

import { useEffect, useCallback, useRef } from "react";
import { initTracker, getTracker, trackEvent, trackPageView, setUserId, stopTracker, destroyTracker, ActivityTracker } from "@/lib/tracking/client-tracker";
import { usePathname, useSearchParams } from "next/navigation";

interface UseTrackingOptions {
  enabled?: boolean;
  userId?: string;
  config?: Partial<ConstructorParameters<typeof ActivityTracker>[0]>;
}

export function useTracking(options: UseTrackingOptions = {}) {
  const { enabled = true, userId, config } = options;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackerRef = useRef<ActivityTracker | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!enabled || isInitialized.current) return;

    const tracker = initTracker({
      apiEndpoint: "",
      sessionToken: config?.sessionToken,
      userId,
      sampleRate: config?.sampleRate ?? 1,
      trackClicks: config?.trackClicks ?? true,
      trackScroll: config?.trackScroll ?? true,
      trackMouseMove: config?.trackMouseMove ?? false,
      trackKeyPress: config?.trackKeyPress ?? false,
      trackVisibilityChange: config?.trackVisibilityChange ?? true,
      trackResize: config?.trackResize ?? true,
      debounceMs: config?.debounceMs ?? 100,
      batchSize: config?.batchSize ?? 10,
      flushInterval: config?.flushInterval ?? 5000,
    });

    trackerRef.current = tracker;
    isInitialized.current = true;

    return () => {
      destroyTracker();
      trackerRef.current = null;
      isInitialized.current = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!trackerRef.current) return;
    
    const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView({ path });
  }, [pathname, searchParams]);

  const trackCustomEvent = useCallback((event: Parameters<typeof trackEvent>[0]) => {
    trackEvent(event);
  }, []);

  const updateUserId = useCallback((newUserId: string) => {
    setUserId(newUserId);
  }, []);

  const stop = useCallback(() => {
    stopTracker();
  }, []);

  const start = useCallback(() => {
    if (trackerRef.current && !getTracker()) {
      trackerRef.current.start();
    }
  }, []);

  return {
    tracker: trackerRef.current,
    trackEvent: trackCustomEvent,
    trackPageView,
    setUserId: updateUserId,
    stop,
    start,
    isTracking: !!trackerRef.current,
  };
}

export function usePageTracking(pageName?: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useTracking();

  useEffect(() => {
    const path = pageName || pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView({ path });
  }, [pathname, searchParams, pageName, trackPageView]);
}

export function useEventTracking() {
  const { trackEvent } = useTracking();

  const trackClick = useCallback((element: string, elementType?: string, metadata?: Record<string, any>) => {
    trackEvent({
      name: "click",
      category: "ui_interaction",
      action: "click",
      label: element,
      metadata: { elementType, ...metadata },
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, any>) => {
    trackEvent({
      name: "form_submit",
      category: "form",
      action: "submit",
      label: formName,
      metadata,
    });
  }, [trackEvent]);

  const trackNavigation = useCallback((from: string, to: string, metadata?: Record<string, any>) => {
    trackEvent({
      name: "navigation",
      category: "navigation",
      action: "navigate",
      label: `${from} -> ${to}`,
      metadata: { from, to, ...metadata },
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent({
      name: "error",
      category: "error",
      action: "error",
      label: error.message,
      metadata: { stack: error.stack, context },
    });
  }, [trackEvent]);

  const trackCustom = useCallback((name: string, category: string, action: string, label?: string, metadata?: Record<string, any>) => {
    trackEvent({ name, category, action, label, metadata });
  }, [trackEvent]);

  return {
    trackClick,
    trackFormSubmit,
    trackNavigation,
    trackError,
    trackCustom,
  };
}