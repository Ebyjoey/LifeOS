"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface TrackerConfig {
  apiUrl: string;
  sessionToken?: string;
  userId?: string;
  debug?: boolean;
  sampleRate?: number;
  batchSize?: number;
  flushInterval?: number;
}

interface ActivityData {
  type: string;
  page?: string;
  element?: string;
  elementType?: string;
  x?: number;
  y?: number;
  scrollX?: number;
  scrollY?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface EventData {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface PageViewData {
  path: string;
  title?: string;
  referrer?: string;
  duration?: number;
  metadata?: Record<string, any>;
  enteredAt?: string;
  exitedAt?: string;
}

class ActivityTracker {
  private config: Required<TrackerConfig>;
  private sessionToken: string | null = null;
  private userId: string | null = null;
  private activityQueue: ActivityData[] = [];
  private eventQueue: EventData[] = [];
  private pageViewQueue: PageViewData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private currentPageViewId: string | null = null;
  private pageViewStartTime: number = Date.now();
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(config: TrackerConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      sessionToken: config.sessionToken || null,
      userId: config.userId || null,
      debug: config.debug || false,
      sampleRate: config.sampleRate || 1,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000,
    };
  }

  init(sessionToken?: string, userId?: string): void {
    if (this.isInitialized) return;

    this.sessionToken = sessionToken || this.getSessionTokenFromCookie() || this.generateSessionToken();
    this.userId = userId || null;

    this.setSessionCookie(this.sessionToken);
    this.setupEventListeners();
    this.startFlushTimer();
    this.trackPageView();
    this.isInitialized = true;

    this.log("Tracker initialized", { sessionToken: this.sessionToken, userId: this.userId });
  }

  private getSessionTokenFromCookie(): string | null {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    return cookies["session_token"] || cookies["sessionToken"] || null;
  }

  private generateSessionToken(): string {
    return "st_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private setSessionCookie(token: string): void {
    if (typeof document === "undefined") return;
    const expires = new Date();
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.cookie = `session_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
  }

  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden") {
        this.flush();
        this.trackActivity({ type: "VISIBILITY_CHANGE", metadata: { state: "hidden" } });
      } else {
        this.trackActivity({ type: "VISIBILITY_CHANGE", metadata: { state: "visible" } });
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);

    this.beforeUnloadHandler = () => {
      this.flush();
      this.endPageView();
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    let lastScrollTime = 0;
    window.addEventListener("scroll", () => {
      const now = Date.now();
      if (now - lastScrollTime > 100) {
        this.trackActivity({
          type: "SCROLL",
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        });
        lastScrollTime = now;
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      this.trackActivity({
        type: "RESIZE",
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      this.trackActivity({
        type: "CLICK",
        element: target.tagName.toLowerCase(),
        elementType: target.id ? "id" : target.className ? "class" : "tag",
        x: e.clientX,
        y: e.clientY,
        page: window.location.pathname,
      });
    }, { passive: true });

    document.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.trackActivity({
          type: "KEY_PRESS",
          element: e.target.tagName.toLowerCase(),
          elementType: e.target.type || "text",
          page: window.location.pathname,
          metadata: { key: e.key, code: e.code },
        });
      }
    }, { passive: true });

    document.addEventListener("submit", (e) => {
      const form = e.target as HTMLFormElement;
      this.trackEvent({
        name: "form_submit",
        category: "FORM",
        action: "submit",
        label: form.id || form.action || "unknown",
        metadata: { formId: form.id, formAction: form.action },
      });
    }, { passive: true });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private async sendBatch(endpoint: string, data: any[]): Promise<void> {
    if (data.length === 0) return;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.sessionToken) {
        headers["Cookie"] = `session_token=${this.sessionToken}`;
      }

      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          userId: this.userId,
          [endpoint === "/api/track/activity" ? "activities" : endpoint === "/api/track/event" ? "events" : "pageViews"]: data,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.sessionToken && result.sessionToken !== this.sessionToken) {
        this.sessionToken = result.sessionToken;
        this.setSessionCookie(this.sessionToken);
      }
    } catch (error) {
      this.log("Failed to send batch", { endpoint, error });
    }
  }

  flush(): void {
    if (this.activityQueue.length > 0) {
      const batch = this.activityQueue.splice(0, this.config.batchSize);
      this.sendBatch("/api/track/activity", batch);
    }
    if (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, this.config.batchSize);
      this.sendBatch("/api/track/event", batch);
    }
    if (this.pageViewQueue.length > 0) {
      const batch = this.pageViewQueue.splice(0, this.config.batchSize);
      this.sendBatch("/api/track/pageview", batch);
    }
  }

  trackActivity(data: ActivityData): void {
    if (Math.random() > this.config.sampleRate) return;
    this.activityQueue.push({ ...data, timestamp: data.timestamp || new Date().toISOString() });
    if (this.activityQueue.length >= this.config.batchSize) this.flush();
  }

  trackEvent(data: EventData): void {
    this.eventQueue.push({ ...data, timestamp: data.timestamp || new Date().toISOString() });
    if (this.eventQueue.length >= this.config.batchSize) this.flush();
  }

  trackPageView(data?: Partial<PageViewData>): void {
    this.endPageView();
    this.pageViewStartTime = Date.now();
    const pageViewData: PageViewData = {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      enteredAt: new Date().toISOString(),
      ...data,
    };
    this.pageViewQueue.push(pageViewData);
    this.flush();
  }

  endPageView(): void {
    if (this.pageViewQueue.length > 0) {
      const lastPageView = this.pageViewQueue[this.pageViewQueue.length - 1];
      lastPageView.exitedAt = new Date().toISOString();
      lastPageView.duration = Date.now() - this.pageViewStartTime;
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
    this.setSessionCookie(token);
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    }
    this.flush();
    this.isInitialized = false;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log("[ActivityTracker]", ...args);
    }
  }
}

let trackerInstance: ActivityTracker | null = null;

export function initTracker(config: TrackerConfig): ActivityTracker {
  if (!trackerInstance) {
    trackerInstance = new ActivityTracker(config);
  }
  return trackerInstance;
}

export function getTracker(): ActivityTracker | null {
  return trackerInstance;
}

export function trackActivity(data: ActivityData): void {
  trackerInstance?.trackActivity(data);
}

export function trackEvent(data: EventData): void {
  trackerInstance?.trackEvent(data);
}

export function trackPageView(data?: Partial<PageViewData>): void {
  trackerInstance?.trackPageView(data);
}

export function setUserId(userId: string): void {
  trackerInstance?.setUserId(userId);
}

export function flushTracker(): void {
  trackerInstance?.flush();
}