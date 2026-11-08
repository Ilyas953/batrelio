"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { markTourDone } from "@/app/espace/tour-actions";
import { TOUR_STEPS, placeBubble, stepsForPage, type Box, type TourStep } from "@/lib/onboarding/tour";

export const START_TOUR_EVENT = "batrelio:start-tour";
const DONE_IN_THIS_BROWSER = "batrelio:tour-done";
const SPOTLIGHT_PADDING = 6;
const ESTIMATED_BUBBLE_HEIGHT = 230;

// The visible element for a target: the tabs exist twice (header on computers, bottom bar on phones).
function findTarget(target: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  return [...candidates].find((element) => element.getClientRects().length > 0) ?? null;
}

function readBox(element: HTMLElement | null): Box | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function rememberDoneHere() {
  try {
    localStorage.setItem(DONE_IN_THIS_BROWSER, "1");
  } catch {
    // Private browsing: the account still remembers it.
  }
}

function isDoneHere(): boolean {
  try {
    return localStorage.getItem(DONE_IN_THIS_BROWSER) === "1";
  } catch {
    return false;
  }
}

// Bubbles shown on the first visit, one place at a time, with a way to skip them all.
export function OnboardingTour({ autoStart }: { autoStart: boolean }) {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);

  const start = useCallback(() => {
    setSteps(stepsForPage(TOUR_STEPS, (target) => findTarget(target) !== null));
    setIndex(0);
  }, []);

  const finish = useCallback(() => {
    setSteps(null);
    rememberDoneHere();
    markTourDone().catch(() => {});
  }, []);

  useEffect(() => {
    // Lets the page draw itself first.
    const timer = autoStart && !isDoneHere() ? window.setTimeout(start, 700) : undefined;
    window.addEventListener(START_TOUR_EVENT, start);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(START_TOUR_EVENT, start);
    };
  }, [autoStart, start]);

  if (!steps) return null;
  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <TourBubble
      key={step.id}
      step={step}
      position={`${index + 1} / ${steps.length}`}
      isLast={isLast}
      onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
      onNext={isLast ? finish : () => setIndex(index + 1)}
      onSkip={finish}
    />
  );
}

type TourBubbleProps = {
  step: TourStep;
  position: string;
  isLast: boolean;
  onPrevious?: () => void;
  onNext: () => void;
  onSkip: () => void;
};

function TourBubble({ step, position, isLast, onPrevious, onNext, onSkip }: TourBubbleProps) {
  const [box, setBox] = useState<Box | null>(null);
  const [screen, setScreen] = useState({ width: 0, height: 0 });
  const [bubbleHeight, setBubbleHeight] = useState(ESTIMATED_BUBBLE_HEIGHT);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Brings the element into view, then follows it when the page scrolls or turns.
  useEffect(() => {
    const element = step.target ? findTarget(step.target) : null;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => {
      setBox(readBox(element));
      setScreen({ width: window.innerWidth, height: window.innerHeight });
    };
    measure();
    const settle = window.setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    nextRef.current?.focus();
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleHeight(bubbleRef.current.offsetHeight);
  }, [step, screen.width]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onSkip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  if (!screen.width) return null;
  const bubbleWidth = Math.min(360, screen.width - 32);
  const placement = placeBubble(box, screen, { width: bubbleWidth, height: bubbleHeight });

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Darkens the page, except around the element being explained; catches taps meanwhile. */}
      {box ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl ring-4 ring-orange-400 transition-all duration-300"
          style={{
            top: box.top - SPOTLIGHT_PADDING,
            left: box.left - SPOTLIGHT_PADDING,
            width: box.width + SPOTLIGHT_PADDING * 2,
            height: box.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(12, 10, 9, 0.65)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-stone-950/65" />
      )}

      <div
        ref={bubbleRef}
        className="fixed rounded-3xl bg-white p-5 shadow-2xl transition-all duration-300"
        style={{ top: placement.top, left: placement.left, width: bubbleWidth }}
      >
        {placement.side !== "center" && (
          <span
            aria-hidden="true"
            className={`absolute size-4 rotate-45 bg-white ${placement.side === "below" ? "-top-2" : "-bottom-2"}`}
            style={{ left: placement.arrowLeft - 8 }}
          />
        )}
        <p className="text-sm font-semibold text-orange-700">{position}</p>
        <h2 id="tour-title" className="mt-1 text-xl font-extrabold text-stone-900">
          {step.title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-stone-700">{step.text}</p>
        <div className="mt-4 flex items-center gap-2">
          {!isLast && (
            <button type="button" onClick={onSkip} className="mr-auto min-h-12 px-1 text-base font-semibold text-stone-500 underline">
              Passer le tuto
            </button>
          )}
          {onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              className="min-h-12 rounded-2xl px-4 text-base font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
            >
              Précédent
            </button>
          )}
          <button
            ref={nextRef}
            type="button"
            onClick={onNext}
            className={`min-h-12 rounded-2xl bg-orange-600 px-5 text-base font-semibold text-white hover:bg-orange-700 ${isLast ? "ml-auto" : ""}`}
          >
            {isLast ? "Terminer" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// "Revoir le tuto", in Réglages.
export function RestartTourButton({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))} className={className}>
      {children}
    </button>
  );
}
