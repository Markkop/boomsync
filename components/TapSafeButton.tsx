import React, { useRef } from 'react';

const MOVE_THRESHOLD_PX = 10;

type TapSafeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'type'
> & {
  onTap: () => void;
};

/**
 * Button that won't "tap" if the user was scrolling (touch/pointer moved).
 * This prevents accidental activations at the end of a swipe/scroll gesture.
 */
export const TapSafeButton: React.FC<TapSafeButtonProps> = ({
  onTap,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  disabled,
  ...rest
}) => {
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null
  );
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);

  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      onClick={(e) => {
        if (disabled) return;
        if (suppressClickRef.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClickRef.current = false;
          return;
        }
        onTap();
      }}
      onPointerDown={(e) => {
        if (disabled) return;
        startRef.current = {
          x: e.clientX,
          y: e.clientY,
          pointerId: e.pointerId,
        };
        movedRef.current = false;
        suppressClickRef.current = false;
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        if (disabled) return;
        const start = startRef.current;
        if (!start || start.pointerId !== e.pointerId) {
          onPointerMove?.(e);
          return;
        }
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (!movedRef.current && Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) {
          movedRef.current = true;
          suppressClickRef.current = true;
        }
        onPointerMove?.(e);
      }}
      onPointerUp={(e) => {
        if (disabled) return;
        onPointerUp?.(e);
        startRef.current = null;
        movedRef.current = false;
      }}
      onPointerCancel={(e) => {
        if (disabled) return;
        onPointerCancel?.(e);
        startRef.current = null;
        movedRef.current = false;
        suppressClickRef.current = true;
      }}
    />
  );
};

