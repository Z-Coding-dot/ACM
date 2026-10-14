import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation(query => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
window.scrollTo = vi.fn();
// jsdom has no viewport observer. Simulate visible elements; real viewport/motion behavior is covered by Playwright.
globalThis.IntersectionObserver = class implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px'; readonly thresholds = [0]; private targets = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.targets.add(target);
    queueMicrotask(() => { if (!this.targets.has(target)) return; const bounds = target.getBoundingClientRect(); this.callback([{ target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: bounds, intersectionRect: bounds, rootBounds: null, time: performance.now() }], this); });
  }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  takeRecords(): IntersectionObserverEntry[] { return []; }
};
// jsdom has no native modal implementation; browser tests cover actual focus containment.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
