"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";
import styles from "./CustomCursor.module.scss";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  const mouseX = useSpring(0, { stiffness: 500, damping: 28 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 28 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") !== null ||
        target.closest("button") !== null
      );
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      <motion.div
        className={styles.cursor}
        style={{
          x: mouseX,
          y: mouseY,
          scale: isPointer ? 1.5 : 1,
        }}
      >
        <div className={styles.dot} />
      </motion.div>
      <motion.div
        className={styles.cursorRing}
        style={{
          x: mouseX,
          y: mouseY,
          scale: isPointer ? 2.5 : 1,
          opacity: isPointer ? 0.5 : 0.2,
        }}
      />
    </>
  );
}
