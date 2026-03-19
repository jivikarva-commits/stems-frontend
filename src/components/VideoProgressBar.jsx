import { useState, useRef, useCallback, useEffect } from "react";

/**
 * VideoProgressBar - Custom video seek/progress bar component
 *
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} duration - Total video duration in seconds
 * @param {function} onSeek - Callback when user seeks (receives time in seconds)
 * @param {boolean} disabled - Disable interactions
 * @param {boolean} isMobile - Mobile responsive mode
 */
export default function VideoProgressBar({
  currentTime = 0,
  duration = 0,
  onSeek,
  disabled = false,
  isMobile = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const barRef = useRef(null);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate time from position
  const getTimeFromPosition = useCallback((clientX) => {
    if (!barRef.current || duration <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return percentage * duration;
  }, [duration]);

  // Handle click on progress bar
  const handleClick = useCallback((e) => {
    if (disabled || !onSeek) return;
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  }, [disabled, onSeek, getTimeFromPosition]);

  // Handle mouse down (start dragging)
  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    if (onSeek) onSeek(time);
  }, [disabled, onSeek, getTimeFromPosition]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const time = getTimeFromPosition(touch.clientX);
    if (onSeek) onSeek(time);
  }, [disabled, onSeek, getTimeFromPosition]);

  // Handle mouse move (while dragging or hovering)
  const handleMouseMove = useCallback((e) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setHoverPosition(percentage);
    setHoverTime(getTimeFromPosition(e.clientX));

    if (isDragging && onSeek) {
      const time = getTimeFromPosition(e.clientX);
      onSeek(time);
    }
  }, [isDragging, onSeek, getTimeFromPosition]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !onSeek) return;
    const touch = e.touches[0];
    const time = getTimeFromPosition(touch.clientX);
    onSeek(time);
  }, [isDragging, onSeek, getTimeFromPosition]);

  // Handle mouse up (stop dragging)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse/touch events for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        if (onSeek) {
          const time = getTimeFromPosition(e.clientX);
          onSeek(time);
        }
      };
      const handleGlobalMouseUp = () => setIsDragging(false);
      const handleGlobalTouchMove = (e) => {
        if (onSeek && e.touches[0]) {
          const time = getTimeFromPosition(e.touches[0].clientX);
          onSeek(time);
        }
      };
      const handleGlobalTouchEnd = () => setIsDragging(false);

      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchmove", handleGlobalTouchMove);
      window.addEventListener("touchend", handleGlobalTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
        window.removeEventListener("touchmove", handleGlobalTouchMove);
        window.removeEventListener("touchend", handleGlobalTouchEnd);
      };
    }
  }, [isDragging, onSeek, getTimeFromPosition]);

  const barHeight = isHovering || isDragging ? 8 : 4;

  return (
    <div
      style={{
        width: "100%",
        padding: isMobile ? "8px 0" : "10px 0",
        userSelect: "none",
      }}
    >
      {/* Progress bar container */}
      <div
        ref={barRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); if (!isDragging) setHoverPosition(0); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          height: 20,
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Background track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: barHeight,
            background: "rgba(71, 85, 105, 0.5)",
            borderRadius: barHeight / 2,
            transition: "height 0.15s ease",
            overflow: "hidden",
          }}
        >
          {/* Buffered/loaded indicator (optional visual) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              background: "rgba(99, 102, 241, 0.2)",
              borderRadius: barHeight / 2,
            }}
          />

          {/* Progress fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
              borderRadius: barHeight / 2,
              transition: isDragging ? "none" : "width 0.1s linear",
            }}
          />

          {/* Hover preview line */}
          {(isHovering || isDragging) && hoverPosition > 0 && (
            <div
              style={{
                position: "absolute",
                left: `${hoverPosition}%`,
                top: 0,
                bottom: 0,
                width: 2,
                background: "rgba(255, 255, 255, 0.5)",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Seek thumb/handle */}
        <div
          style={{
            position: "absolute",
            left: `${Math.min(100, Math.max(0, progress))}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: isHovering || isDragging ? 14 : 0,
            height: isHovering || isDragging ? 14 : 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #818cf8, #a78bfa)",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
            transition: "width 0.15s ease, height 0.15s ease",
            pointerEvents: "none",
          }}
        />

        {/* Hover time tooltip */}
        {(isHovering || isDragging) && hoverPosition > 0 && duration > 0 && (
          <div
            style={{
              position: "absolute",
              left: `${hoverPosition}%`,
              bottom: 24,
              transform: "translateX(-50%)",
              background: "rgba(15, 10, 48, 0.95)",
              color: "#e0e7ff",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 6,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Time display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
          padding: "0 2px",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 11 : 12,
            fontWeight: 600,
            color: "#c7d2fe",
            fontFamily: "monospace",
          }}
        >
          {formatTime(currentTime)}
        </span>
        <span
          style={{
            fontSize: isMobile ? 11 : 12,
            fontWeight: 600,
            color: "rgba(165, 180, 252, 0.6)",
            fontFamily: "monospace",
          }}
        >
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
