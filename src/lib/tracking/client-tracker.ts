"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ActivityType } from "@/generated/prisma/enums";

interface TrackingConfig {
  apiEndpoint: string;
  sessionToken?: string;
  userId?: string;
  sampleRate?: number;
  trackClicks?: boolean;
  trackScroll?: boolean;
  trackMouseMove?: boolean;
  trackKeyPress?: boolean;
  trackVisibilityChange?: boolean;
  trackResize?: boolean;
  debounceMs?: number;
  batchSize?: number;
  flushInterval?: number;
}

interface ActivityData {
  type: ActivityType;
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
  private config: Required<TrackingConfig>;
  private activityQueue: ActivityData[] = [];
  private eventQueue: EventData[] = [];
  private pageViewQueue: PageViewData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionToken: string;
  private isTracking = false;
  private lastScrollTime = 0;
  private lastMouseMoveTime = 0;
  private pageViewStartTime = Date.now();
  private currentPath: string;
  private abortController: AbortController | null = null;

  constructor(config: TrackingConfig) {
    this.config = {
      apiEndpoint: config.apiEndpoint,
      sessionToken: config.sessionToken || "",
      userId: config.userId || "",
      sampleRate: config.sampleRate ?? 1,
      trackClicks: config.trackClicks ?? true,
      trackScroll: config.trackScroll ?? true,
      trackMouseMove: config.trackMouseMove ?? false,
      trackKeyPress: config.trackKeyPress ?? false,
      trackVisibilityChange: config.trackVisibilityChange ?? true,
      trackResize: config.trackResize ?? true,
      debounceMs: config.debounceMs ?? 100,
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 5000,
    };

    this.sessionToken = this.config.sessionToken || this.getOrCreateSessionToken();
    this.currentPath = window.location.pathname + window.location.search;
    this.setupFlushTimer();
  }

  private getOrCreateSessionToken(): string {
    const cookieName = "session_token";
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies[cookieName]) {
      return cookies[cookieName];
    }

    const token = this.generateSessionToken();
    document.cookie = `${cookieName}=${token}; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`;
    return token;
  }

  private generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  start(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.pageViewStartTime = Date.now();

    if (this.config.trackClicks) this.attachClickListener();
    if (this.config.trackScroll) this.attachScrollListener();
    if (this.config.trackMouseMove) this.attachMouseMoveListener();
    if (this.config.trackKeyPress) this.attachKeyPressListener();
    if (this.config.trackVisibilityChange) this.attachVisibilityChangeListener();
    if (this.config.trackResize) this.attachResizeListener();

    this.trackPageView({ path: this.currentPath });
  }

  stop(): void {
    if (!this.isTracking) return;
    this.isTracking = false;

    this.detachClickListener();
    this.detachScrollListener();
    this.detachMouseMoveListener();
    this.detachKeyPressListener();
    this.detachVisibilityChangeListener();
    this.detachResizeListener();

    this.flush();
    this.trackPageViewExit();

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private attachClickListener(): void {
    document.addEventListener("click", this.handleClick.bind(this), true);
  }

  private detachClickListener(): void {
    document.removeEventListener("click", this.handleClick.bind(this), true);
  }

  private handleClick(event: MouseEvent): void {
    if (Math.random() > this.config.sampleRate) return;

    const target = event.target as HTMLElement;
    this.queueActivity({
      type: "CLICK",
      page: this.currentPath,
      element: target.tagName.toLowerCase(),
      elementType: target.id || target.className || target.getAttribute("role") || undefined,
      x: event.clientX,
      y: event.clientY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }

  private attachScrollListener(): void {
    window.addEventListener("scroll", this.handleScroll.bind(this), { passive: true });
  }

  private detachScrollListener(): void {
    window.removeEventListener("scroll", this.handleScroll.bind(this));
  }

  private handleScroll(): void {
    const now = Date.now();
    if (now - this.lastScrollTime < this.config.debounceMs) return;
    this.lastScrollTime = now;

    if (Math.random() > this.config.sampleRate) return;

    this.queueActivity({
      type: "SCROLL",
      page: this.currentPath,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }

  private attachMouseMoveListener(): void {
    document.addEventListener("mousemove", this.handleMouseMove.bind(this), { passive: true });
  }

  private detachMouseMoveListener(): void {
    document.removeEventListener("mousemove", this.handleMouseMove.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    const now = Date.now();
    if (now - this.lastMouseMoveTime < this.config.debounceMs * 10) return;
    this.lastMouseMoveTime = now;

    if (Math.random() > this.config.sampleRate * 0.1) return;

    this.queueActivity({
      type: "MOUSE_MOVE",
      page: this.currentPath,
      x: event.clientX,
      y: event.clientY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }

  private attachKeyPressListener(): void {
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
  }

  private detachKeyPressListener(): void {
    document.removeEventListener("keydown", this.handleKeyPress.bind(this));
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (Math.random() > this.config.sampleRate) return;

    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      this.queueActivity({
        type: "FORM_INTERACTION",
        page: this.currentPath,
        element: target.tagName.toLowerCase(),
        elementType: target.getAttribute("type") || target.getAttribute("name") || undefined,
        metadata: { key: event.key, code: event.code },
      });
    } else {
      this.queueActivity({
        type: "KEY_PRESS",
        page: this.currentPath,
        metadata: { key: event.key, code: event.code },
      });
    }
  }

  private attachVisibilityChangeListener(): void {
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
  }

  private detachVisibilityChangeListener(): void {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
  }

  private handleVisibilityChange(): void {
    this.queueActivity({
      type: "VISIBILITY_CHANGE",
      page: this.currentPath,
      metadata: { visibilityState: document.visibilityState },
    });
  }

  private attachResizeListener(): void {
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private detachResizeListener(): void {
    window.removeEventListener("resize", this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.queueActivity({
      type: "RESIZE",
      page: this.currentPath,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }

  trackPageView(data: PageViewData): void {
    this.currentPath = data.path || window.location.pathname + window.location.search;
    this.pageViewStartTime = Date.now();

    this.pageViewQueue.push({
      path: this.currentPath,
      title: data.title || document.title,
      referrer: data.referrer || document.referrer,
      metadata: data.metadata,
      enteredAt: data.enteredAt || new Date().toISOString(),
    });

    if (this.pageViewQueue.length >= this.config.batchSize) {
      this.flushPageViews();
    }
  }

  private trackPageViewExit(): void {
    const duration = Date.now() - this.pageViewStartTime;
    if (this.pageViewQueue.length > 0) {
      const lastView = this.pageViewQueue[this.pageViewQueue.length - 1];
      lastView.exitedAt = new Date().toISOString();
      lastView.duration = duration;
    }
    this.flushPageViews();
  }

  trackEvent(data: EventData): void {
    this.eventQueue.push({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    });

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  private queueActivity(data: ActivityData): void {
    this.activityQueue.push({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    });

    if (this.activityQueue.length >= this.config.batchSize) {
      this.flushActivities();
    }
  }

  async flush(): Promise<void> {
    await Promise.all([
      this.flushActivities(),
      this.flushEvents(),
      this.flushPageViews(),
    ]);
  }

  private async flushActivities(): Promise<void> {
    if (this.activityQueue.length === 0) return;
    const activities = [...this.activityQueue];
    this.activityQueue = [];
    await this.sendToApi("/api/track/activity", { activities });
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    const events = [...this.eventQueue];
    this.eventQueue = [];
    await this.sendToApi("/api/track/event", { events });
  }

  private async flushPageViews(): Promise<void> {
    if (this.pageViewQueue.length === 0) return;
    const pageViews = [...this.pageViewQueue];
    this.pageViewQueue = [];
    await this.sendToApi("/api/track/pageview", { pageViews });
  }

  private async sendToApi(endpoint: string, body: any): Promise<void> {
    try {
      this.abortController = new AbortController();
      const response = await fetch(`${this.config.apiEndpoint}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": this.sessionToken,
          ...(this.config.userId && { "X-User-ID": this.config.userId }),
        },
        body: JSON.stringify(body),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        console.warn(`Tracking API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.sessionToken) {
        this.sessionToken = data.sessionToken;
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.warn("Tracking request failed:", error);
      }
    }
  }

  setUserId(userId: string): void {
    this.config.userId = userId;
  }

  getSessionToken(): string {
    return this.sessionToken;
  }

  destroy(): void {
    this.stop();
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

let trackerInstance: ActivityTracker | null = null;

export function initTracker(config: TrackingConfig): ActivityTracker {
  if (trackerInstance) {
    trackerInstance.destroy();
  }
  trackerInstance = new ActivityTracker(config);
  trackerInstance.start();
  return trackerInstance;
}

export function getTracker(): ActivityTracker | null {
  return trackerInstance;
}

export function trackEvent(data: EventData): void {
  trackerInstance?.trackEvent(data);
}

export function trackPageView(data: PageViewData): void {
  trackerInstance?.trackPageView(data);
}

export function setUserId(userId: string): void {
  trackerInstance?.setUserId(userId);
}

export function stopTracker(): void {
  trackerInstance?.stop();
}

export function destroyTracker(): void {
  trackerInstance?.destroy();
  trackerInstance = null;
}