"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.8,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fromVars: gsap.TweenVars = { opacity: 0 };
    const toVars: gsap.TweenVars = { opacity: 1, duration, delay, ease: "power3.out" };

    switch (direction) {
      case "up":
        fromVars.y = 60;
        toVars.y = 0;
        break;
      case "left":
        fromVars.x = -80;
        toVars.x = 0;
        break;
      case "right":
        fromVars.x = 80;
        toVars.x = 0;
        break;
      case "scale":
        fromVars.scale = 0.8;
        toVars.scale = 1;
        break;
    }

    gsap.set(el, fromVars);

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once,
      onEnter: () => gsap.to(el, toVars),
    });

    return () => trigger.kill();
  }, [direction, delay, duration, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Stagger children animation
export function ScrollStagger({
  children,
  className = "",
  stagger = 0.1,
  childSelector = "> *",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  childSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = el.querySelectorAll(":scope > *");
    gsap.set(items, { opacity: 0, y: 40 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          stagger,
          duration: 0.6,
          ease: "power3.out",
        });
      },
    });

    return () => trigger.kill();
  }, [stagger, childSelector]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Parallax effect
export function Parallax({
  children,
  className = "",
  speed = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.to(el, {
      y: () => speed * -100,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Text reveal line by line
export function TextReveal({
  text,
  className = "",
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const chars = el.querySelectorAll(".char");
    gsap.set(chars, { opacity: 0, y: 20 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(chars, {
          opacity: 1,
          y: 0,
          stagger: 0.02,
          duration: 0.5,
          ease: "power3.out",
        });
      },
    });

    return () => trigger.kill();
  }, [text]);

  return (
    <div ref={ref} className={className} role="heading">
      {text.split("").map((char, i) => (
        <span key={i} className="char" style={{ display: "inline-block" }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
