import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import DashboardLayout from "../components/layout/DashboardLayout";
import AIMentor, { MentorTriggerIcon } from "../components/AIMentor";
import VideoEndOverlay from "../components/VideoEndOverlay";
import VideoProgressBar from "../components/VideoProgressBar";

import {
  Play, Search, BookMarked, FileText, Sparkles,
  Loader2, Video, X, MessageSquare, ChevronDown,
  ChevronUp, SlidersHorizontal, GraduationCap, Pause
} from "lucide-react";

function getAuthHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Activity Logger ──────────────────────────────────────────────────────────
const _logActivity = (activityType, description) => {
  try {
    const token = localStorage.getItem("token");
    axios.post(
      `${API}/activity/log`,
      { activity_type: activityType, description },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      }
    ).catch(() => {});
  } catch {}
};
// ─────────────────────────────────────────────────────────────────────────────

export const logActivity = async (activityType, description) => {
  try {
    await axios.post(
      `${API}/activity/log`,
      { activity_type: activityType, description },
      { headers: getAuthHeaders(), withCredentials: true }
    );
  } catch {}
};

// Extract YouTube video ID from various URL formats
function getVideoId(url) {
  if (!url) return null;
  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  return null;
}

// YouTube IFrame API loader
let ytApiLoaded = false;
let ytApiLoadPromise = null;

function loadYouTubeApi() {
  if (ytApiLoaded && window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (ytApiLoadPromise) {
    return ytApiLoadPromise;
  }
  ytApiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      ytApiLoaded = true;
      resolve();
      return;
    }
    // Create callback for when API is ready
    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      ytApiLoaded = true;
      resolve();
    };
    // Load the script if not already present
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return ytApiLoadPromise;
}

function getThumbId(url) {
  return getVideoId(url);
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(30,27,75,0.4)",
      border: "1.5px solid rgba(99,102,241,0.12)",
      borderRadius: 14, overflow: "hidden",
      animation: "vlpulse 1.5s ease-in-out infinite",
    }}>
      <div style={{ paddingTop: "56.25%", background: "rgba(99,102,241,0.08)", position: "relative" }} />
      <div style={{ padding: "12px 13px" }}>
        <div style={{ height: 12, background: "rgba(99,102,241,0.12)", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 10, background: "rgba(99,102,241,0.08)", borderRadius: 6, width: "60%" }} />
      </div>
    </div>
  );
}

// ─── Compact Mobile Card ──────────────────────────────────────────────────────
function MobileVideoCard({ video, isActive, onClick }) {
  const thumbId = getThumbId(video.youtube_url);
  const thumb = thumbId ? `https://img.youtube.com/vi/${thumbId}/mqdefault.jpg` : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 12, alignItems: "center",
        padding: "10px 12px",
        background: isActive
          ? "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.15))"
          : "rgba(30,27,75,0.5)",
        border: `1.5px solid ${isActive ? "rgba(129,140,248,0.6)" : "rgba(99,102,241,0.15)"}`,
        borderRadius: 12, cursor: "pointer",
        transition: "all 0.18s",
        boxShadow: isActive ? "0 0 0 2px rgba(129,140,248,0.2)" : "none",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: "relative", width: 72, height: 48,
        borderRadius: 8, overflow: "hidden", flexShrink: 0,
        background: "#0f0a30",
      }}>
        {thumb ? (
          <img src={thumb} alt={video.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Video size={20} style={{ color: "rgba(129,140,248,0.4)" }} />
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: isActive ? "rgba(79,70,229,0.35)" : "rgba(0,0,0,0.2)",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: isActive ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Play size={10} style={{ color: isActive ? "white" : "#4f46e5", marginLeft: 1 }} fill={isActive ? "white" : "#4f46e5"} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: "#e0e7ff",
          margin: "0 0 4px", lineHeight: 1.3,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {video.title}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#818cf8",
            background: "rgba(99,102,241,0.18)", borderRadius: 20, padding: "1px 7px",
          }}>{video.subject}</span>
          {video.level && (
            <span style={{
              fontSize: 10, color: "rgba(165,180,252,0.55)",
              background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "1px 7px",
            }}>{video.level}</span>
          )}
        </div>
      </div>

      {isActive && (
        <div style={{
          fontSize: 9, fontWeight: 700, color: "#818cf8",
          background: "rgba(99,102,241,0.2)", borderRadius: 5,
          padding: "2px 6px", letterSpacing: "0.05em", flexShrink: 0,
        }}>PLAYING</div>
      )}
    </div>
  );
}

// ─── Desktop Video Card ────────────────────────────────────────────────────────
function VideoCard({ video, isActive, onClick }) {
  const thumbId = getThumbId(video.youtube_url);
  const thumb = thumbId ? `https://img.youtube.com/vi/${thumbId}/mqdefault.jpg` : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: isActive
          ? "linear-gradient(145deg, rgba(79,70,229,0.25), rgba(124,58,237,0.2))"
          : "rgba(30,27,75,0.55)",
        border: `1.5px solid ${isActive ? "rgba(129,140,248,0.7)" : "rgba(99,102,241,0.2)"}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: isActive ? "0 0 0 2px rgba(129,140,248,0.25)" : "none",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(129,140,248,0.45)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "translateY(0)"; } }}
    >
      <div style={{ position: "relative", paddingTop: "56.25%", background: "#0f0a30" }}>
        {thumb ? (
          <img src={thumb} alt={video.title} loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Video size={32} style={{ color: "rgba(129,140,248,0.4)" }} />
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: isActive ? "rgba(79,70,229,0.3)" : "rgba(0,0,0,0.25)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: isActive ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
          }}>
            <Play size={18} style={{ color: isActive ? "white" : "#4f46e5", marginLeft: 2 }} fill={isActive ? "white" : "#4f46e5"} />
          </div>
        </div>
        {isActive && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            borderRadius: 6, padding: "2px 8px",
            fontSize: 10, fontWeight: 700, color: "white", letterSpacing: "0.05em",
          }}>NOW PLAYING</div>
        )}
      </div>
      <div style={{ padding: "11px 13px 13px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e0e7ff", marginBottom: 5, lineHeight: 1.4 }}>
          {video.title}
        </h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#818cf8", background: "rgba(99,102,241,0.18)", borderRadius: 20, padding: "2px 8px" }}>
            {video.subject}
          </span>
          {video.level && (
            <span style={{ fontSize: 10, color: "rgba(165,180,252,0.55)", background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "2px 8px" }}>
              {video.level}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Action Button ──────────────────────────────────────────────────────────
function AIActionBtn({ icon, label, onClick, loading, done, color = "#4f46e5", fullWidth = false }) {
  const rgb = color === "#4f46e5" ? "79,70,229" : color === "#0891b2" ? "8,145,178" : color === "#7c3aed" ? "124,58,237" : "234,179,8";
  return (
    <button
      onClick={onClick}
      disabled={loading || done}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: "10px 16px", borderRadius: 10,
        cursor: loading || done ? "default" : "pointer",
        fontFamily: "system-ui,sans-serif", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.04em", transition: "all 0.2s",
        width: fullWidth ? "100%" : "auto",
        background: done ? "rgba(74,222,128,0.18)" : `rgba(${rgb},0.15)`,
        color: done ? "#4ade80" : color,
        border: `1px solid ${done ? "rgba(74,222,128,0.3)" : `rgba(${rgb},0.3)`}`,
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: "vlspin 1s linear infinite" }} /> : icon}
      {label}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function VideoLectures() {
  const { user } = useAuth();
  const [allVideos,     setAllVideos]     = useState([]);
  const [videos,        setVideos]        = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [levels,        setLevels]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter,   setLevelFilter]   = useState("");
  const [showFilters,   setShowFilters]   = useState(false);
  const [activeVideo,   setActiveVideo]   = useState(null);
  const [aiResult,      setAiResult]      = useState("");
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiAction,      setAiAction]      = useState("");
  const [noteSaved,     setNoteSaved]     = useState(false);
  const [mentorText,    setMentorText]    = useState("");
  const [activeSpeech,  setActiveSpeech]  = useState("");
  const [visibleCount,  setVisibleCount]  = useState(10);
  const [isMobile,      setIsMobile]      = useState(false);
  const [isVideoPlaying,setIsVideoPlaying]= useState(false);
  const [isVideoEnded,  setIsVideoEnded]  = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const playerRef = useRef(null);
  const listRef   = useRef(null);
  const searchRef = useRef(null);
  const playerContainerRef = useRef(null); // Container div for YT.Player
  const ytPlayerRef = useRef(null); // YT.Player instance
  const videoDurationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafIdRef = useRef(null); // requestAnimationFrame ID
  const overlayTriggeredRef = useRef(false); // Prevent re-triggering/flickering
  const currentVideoIdRef = useRef(null); // Track current video ID for player
  const playerReadyRef = useRef(false); // Track if player is ready with valid duration
  const isPlayingRef = useRef(false); // Track playing state for RAF loop

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/videos`, {
        headers: getAuthHeaders(), withCredentials: true,
      });
      const vids = res.data.videos || [];
      setAllVideos(vids);
      setVideos(vids);
      const subjs = res.data.subjects?.length
        ? res.data.subjects
        : [...new Set(vids.map(v => v.subject).filter(Boolean))].sort();
      const lvls = [...new Set(vids.map(v => v.level).filter(Boolean))].sort();
      setSubjects(subjs);
      setLevels(lvls);
    } catch {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, []);

  // Client-side filtering — instant
  useEffect(() => {
    const q = search.toLowerCase().trim();
    let filtered = allVideos;
    if (q) {
      filtered = filtered.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.subject?.toLowerCase().includes(q) ||
        v.chapter?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)
      );
    }
    if (subjectFilter) filtered = filtered.filter(v => v.subject === subjectFilter);
    if (levelFilter)   filtered = filtered.filter(v => v.level   === levelFilter);
    setVideos(filtered);
    setVisibleCount(10);
  }, [search, subjectFilter, levelFilter, allVideos]);

  // Infinite scroll on list panel
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
        setVisibleCount(c => c + 10);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleVideoClick = (video) => {
    // Cancel any ongoing RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setActiveVideo(video);
    setIsVideoPlaying(false);
    setIsVideoEnded(false);
    setShowEndOverlay(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    videoDurationRef.current = 0;
    lastTimeRef.current = 0;
    overlayTriggeredRef.current = false; // Reset trigger flag for new video
    playerReadyRef.current = false; // Reset player ready flag
    isPlayingRef.current = false;
    setAiResult("");
    setAiAction("");
    setNoteSaved(false);
    _logActivity("video", `Watched video lecture: ${video.title} (${video.subject || ""})`);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setLevelFilter("");
  };

  const hasFilters = search || subjectFilter || levelFilter;

  // Initialize YouTube Player when activeVideo changes
  useEffect(() => {
    if (!activeVideo) return;

    const videoId = getVideoId(activeVideo.youtube_url);
    if (!videoId) return;

    // Skip if same video
    if (currentVideoIdRef.current === videoId && ytPlayerRef.current) {
      return;
    }
    currentVideoIdRef.current = videoId;
    playerReadyRef.current = false;

    const initPlayer = async () => {
      await loadYouTubeApi();

      // Destroy existing player
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }

      // Wait for container to be available
      if (!playerContainerRef.current) return;

      // Create new player
      ytPlayerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          iv_load_policy: 3,
          disablekb: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            // Set pointerEvents: none on the iframe to block YouTube UI clicks
            const iframe = event.target.getIframe();
            if (iframe) {
              iframe.style.pointerEvents = "none";
            }
            // Wait a moment for duration to be available
            setTimeout(() => {
              const duration = event.target.getDuration();
              if (duration > 0) {
                videoDurationRef.current = duration;
                setVideoDuration(duration);
                playerReadyRef.current = true;
              }
            }, 100);
          },
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsVideoPlaying(true);
              setIsVideoEnded(false);
              setShowEndOverlay(false);
              isPlayingRef.current = true;
              // Re-check duration when video starts playing (more reliable)
              const duration = event.target.getDuration();
              if (duration > 0 && duration !== videoDurationRef.current) {
                videoDurationRef.current = duration;
                setVideoDuration(duration);
                playerReadyRef.current = true;
              }
              // Start RAF tracking
              startProgressTracking();
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsVideoPlaying(false);
              isPlayingRef.current = false;
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsVideoPlaying(false);
              setIsVideoEnded(true);
              isPlayingRef.current = false;
              // Show overlay ONLY when video actually ends
              overlayTriggeredRef.current = true;
              setShowEndOverlay(true);
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      // Cleanup on video change
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [activeVideo]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  // requestAnimationFrame-based progress tracking for accurate timing
  const startProgressTracking = useCallback(() => {
    const trackProgress = () => {
      // Stop if not playing
      if (!isPlayingRef.current) {
        rafIdRef.current = null;
        return;
      }

      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") {
        rafIdRef.current = requestAnimationFrame(trackProgress);
        return;
      }

      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        // Update duration if valid
        if (duration > 0) {
          videoDurationRef.current = duration;
          setVideoDuration(duration);
          playerReadyRef.current = true;
        }

        // Update current time for progress bar
        if (currentTime !== undefined) {
          setVideoCurrentTime(currentTime);
        }

        lastTimeRef.current = currentTime;
      } catch {}

      // Continue tracking if still playing
      if (isPlayingRef.current) {
        rafIdRef.current = requestAnimationFrame(trackProgress);
      }
    };

    // Cancel any existing RAF before starting new one
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(trackProgress);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!ytPlayerRef.current) return;
    try {
      if (isVideoPlaying) {
        ytPlayerRef.current.pauseVideo();
        isPlayingRef.current = false;
      } else {
        const playerState = ytPlayerRef.current.getPlayerState?.();
        if (playerState === window.YT?.PlayerState?.ENDED) {
          ytPlayerRef.current.seekTo(0, true);
        }
        ytPlayerRef.current.playVideo();
        setIsVideoEnded(false);
        setShowEndOverlay(false);
        overlayTriggeredRef.current = false;
        isPlayingRef.current = true;
        startProgressTracking();
      }
    } catch {}
  }, [isVideoPlaying, startProgressTracking]);

  const handleReplay = useCallback(() => {
    if (!ytPlayerRef.current) return;
    try {
      ytPlayerRef.current.seekTo(0, true);
      ytPlayerRef.current.playVideo();
      setIsVideoEnded(false);
      setShowEndOverlay(false);
      setIsVideoPlaying(true);
      lastTimeRef.current = 0;
      overlayTriggeredRef.current = false;
      isPlayingRef.current = true;
      startProgressTracking();
    } catch {}
  }, [startProgressTracking]);

  const handleNextVideo = useCallback(() => {
    if (!activeVideo || videos.length === 0) return;
    const idx = videos.findIndex(v => v.video_id === activeVideo.video_id);
    if (idx < 0 || idx + 1 >= videos.length) return;
    handleVideoClick(videos[idx + 1]);
  }, [activeVideo, videos]);

  // Handle seek from progress bar
  const handleSeek = useCallback((time) => {
    if (!activeVideo || !ytPlayerRef.current) return;
    try {
      // Get fresh duration from player
      const currentDuration = ytPlayerRef.current.getDuration();
      const validDuration = currentDuration > 0 ? currentDuration : videoDurationRef.current;
      
      if (validDuration > 0) {
        videoDurationRef.current = validDuration;
        setVideoDuration(validDuration);
      }
      
      const clampedTime = Math.max(0, Math.min(time, validDuration || 0));
      ytPlayerRef.current.seekTo(clampedTime, true);
      const playerState = ytPlayerRef.current.getPlayerState?.();
      if (playerState === window.YT?.PlayerState?.ENDED) {
        ytPlayerRef.current.playVideo();
      }
      setVideoCurrentTime(clampedTime);
      lastTimeRef.current = clampedTime;

      // Reset overlay if seeking (video hasn't ended yet after seek)
      if (overlayTriggeredRef.current) {
        overlayTriggeredRef.current = false;
        setShowEndOverlay(false);
        setIsVideoEnded(false);
      }
    } catch {}
  }, [activeVideo]);

  // ── AI Actions ─────────────────────────────────────────────────────────────
  const callAI = async (type) => {
    if (!activeVideo) return;
    setAiLoading(true);
    setAiAction(type);
    setAiResult("");

    const prompts = {
      ask:   `You are STEMS AI CS Mentor. The student is watching a lecture titled "${activeVideo.title}" on subject "${activeVideo.subject}", chapter "${activeVideo.chapter}". Give a comprehensive conceptual explanation of this topic with relevant section numbers, case laws, and exam tips.`,
      notes: `Generate structured revision notes for: "${activeVideo.title}" (${activeVideo.subject} - ${activeVideo.chapter}). Format: headings, bullet points, key definitions, section numbers, and a short summary.`,
      mcq:   `Generate 5 MCQs based on: "${activeVideo.title}" (${activeVideo.subject} - ${activeVideo.chapter}). For each: question, 4 options (A-D), correct answer, and brief explanation. Include section references where applicable.`,
    };

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompts[type] }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "No response.";
      setAiResult(text);
    } catch {
      try {
        const backRes = await axios.post(
          `${API}/ai/chat`,
          { message: prompts[type] },
          { headers: getAuthHeaders(), withCredentials: true }
        );
        setAiResult(backRes.data.response || backRes.data.message || "No response.");
      } catch (err) {
        const detail = err?.response?.data?.detail;
        const message = typeof detail === "string" ? detail : detail?.message;
        toast.error(message || "AI request failed");
        setAiResult("");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeVideo || !aiResult) return;
    try {
      await axios.post(
        `${API}/revision-notes`,
        {
          content: `# ${activeVideo.title}\n\n${aiResult}`,
          subject: activeVideo.subject,
          level: activeVideo.level || "General",
        },
        { headers: getAuthHeaders(), withCredentials: true }
      );
      setNoteSaved(true);
      toast.success("Added to Revision Notes ✓");
      _logActivity("notes", `Saved revision notes from: ${activeVideo.title}`);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.info("Already saved");
        setNoteSaved(true);
      } else {
        toast.error("Failed to save note");
      }
    }
  };

  const renderAIContent = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (line.startsWith("### ")) return <h4 key={i} style={{ color: "#e0e7ff", fontSize: 14, fontWeight: 700, margin: "12px 0 5px" }}>{line.slice(4)}</h4>;
      if (line.startsWith("## "))  return <h3 key={i} style={{ color: "#e0e7ff", fontSize: 16, fontWeight: 700, margin: "14px 0 6px" }}>{line.slice(3)}</h3>;
      if (line.startsWith("# "))   return <h2 key={i} style={{ color: "#e0e7ff", fontSize: 18, fontWeight: 700, margin: "16px 0 7px" }}>{line.slice(2)}</h2>;
      if (line.startsWith("- ") || line.startsWith("• ")) return (
        <li key={i} style={{ color: "#c7d2fe", fontSize: 13, marginBottom: 4, marginLeft: 16, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: html.slice(2) }} />
      );
      if (/^\d+\.\s/.test(line)) return (
        <li key={i} style={{ color: "#c7d2fe", fontSize: 13, marginBottom: 4, marginLeft: 16, lineHeight: 1.6, listStyleType: "decimal" }}
          dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s/, "") }} />
      );
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} style={{ color: "#c7d2fe", fontSize: 13, marginBottom: 5, lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  const activeVideoIndex = activeVideo ? videos.findIndex(v => v.video_id === activeVideo.video_id) : -1;
  const hasNextVideo = activeVideoIndex >= 0 && activeVideoIndex < videos.length - 1;
  const visibleVideos = videos.slice(0, visibleCount);

  return (
    <DashboardLayout user={user}>
      <style>{`
        @keyframes vlspin  { to { transform: rotate(360deg); } }
        @keyframes vlpulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes vlslide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

        .vl-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1024px) { .vl-layout { grid-template-columns: 1fr; } }

        .ai-actions-desktop { display: flex; flex-wrap: wrap; gap: 10px; }
        .ai-actions-mobile  { display: flex; flex-direction: column; gap: 8px; }

        .vl-filter-panel {
          display: flex; gap: 10px; flex-wrap: wrap;
          animation: vlslide 0.2s ease;
        }
        @media (max-width: 767px) { .vl-filter-panel { flex-direction: column; } }

        .vl-search-sticky {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(248,250,252,0.96);
          backdrop-filter: blur(12px);
          padding: 10px 0 8px;
          margin-bottom: 4px;
        }

        .vl-list-scroll {
          max-height: 520px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.3) transparent;
        }
        .vl-list-scroll::-webkit-scrollbar { width: 4px; }
        .vl-list-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }

        select.vl-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px !important;
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 0 80px" : 0 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: isMobile ? 14 : 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <div style={{
              width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
              borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <GraduationCap size={isMobile ? 16 : 18} style={{ color: "white" }} />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>Video Lectures</h1>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                {loading ? "Loading..." : `${videos.length} lecture${videos.length !== 1 ? "s" : ""} available`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Search + Filter Toggle (sticky) ── */}
        <div className="vl-search-sticky">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{
                position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                color: "#94a3b8", pointerEvents: "none",
              }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, subject, keyword..."
                style={{
                  width: "100%", padding: "10px 34px 10px 34px",
                  background: "white", border: "1.5px solid #e2e8f0",
                  borderRadius: 10, fontSize: 13, color: "#1e293b",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#818cf8")}
                onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  style={{
                    position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2,
                  }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 14px", borderRadius: 10, flexShrink: 0,
                background: (showFilters || subjectFilter || levelFilter)
                  ? "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.1))"
                  : "white",
                border: `1.5px solid ${(showFilters || subjectFilter || levelFilter) ? "rgba(129,140,248,0.6)" : "#e2e8f0"}`,
                color: (showFilters || subjectFilter || levelFilter) ? "#6366f1" : "#64748b",
                fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <SlidersHorizontal size={14} />
              {!isMobile && <span>Filters</span>}
              {(subjectFilter || levelFilter) && (
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#6366f1", color: "white",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {[subjectFilter, levelFilter].filter(Boolean).length}
                </span>
              )}
              {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div style={{ marginTop: 10 }}>
              <div className="vl-filter-panel">
                <select
                  value={levelFilter}
                  onChange={e => setLevelFilter(e.target.value)}
                  className="vl-select"
                  style={{
                    padding: "9px 32px 9px 12px", background: "white",
                    border: `1.5px solid ${levelFilter ? "#818cf8" : "#e2e8f0"}`,
                    borderRadius: 10, fontSize: 13,
                    color: levelFilter ? "#1e293b" : "#94a3b8",
                    outline: "none", cursor: "pointer",
                    flex: isMobile ? "1" : "0 0 180px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <option value="">All Levels</option>
                  {(levels.length > 0
                    ? levels
                    : ["Foundation", "Executive", "Professional"]
                  ).map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <select
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                  className="vl-select"
                  style={{
                    padding: "9px 32px 9px 12px", background: "white",
                    border: `1.5px solid ${subjectFilter ? "#818cf8" : "#e2e8f0"}`,
                    borderRadius: 10, fontSize: 13,
                    color: subjectFilter ? "#1e293b" : "#94a3b8",
                    outline: "none", cursor: "pointer",
                    flex: isMobile ? "1" : "0 0 220px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <option value="">All Subjects</option>
                  {(subjects.length > 0
                    ? subjects
                    : ["Company Law", "Jurisprudence", "Interpretation", "Economic Law"]
                  ).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {hasFilters && (
                  <button onClick={clearFilters} style={{
                    padding: "9px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)",
                    color: "#ef4444", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    flex: isMobile ? "1" : "auto", justifyContent: "center",
                  }}>
                    <X size={12} /> Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Main layout ── */}
        <div className="vl-layout">

          {/* LEFT: Player + AI */}
          <div>
            {/* Player */}
            <div ref={playerRef} style={{
              background: "#0f0a30",
              borderRadius: isMobile ? 14 : 16, overflow: "hidden",
              border: "1.5px solid rgba(99,102,241,0.3)",
              marginBottom: isMobile ? 12 : 16,
              boxShadow: "0 8px 32px rgba(79,70,229,0.15)",
            }}>
              {activeVideo ? (
                <>
                  {/* YouTube Player container */}
                  <div style={{ position: "relative", paddingTop: "56.25%" }}>
                    <div
                      ref={playerContainerRef}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        background: "#0f0a30",
                        zIndex: 1,
                        pointerEvents: showEndOverlay ? "none" : "auto",
                      }}
                    />

                    {/* End-only blur blocker layer */}
                    {showEndOverlay && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(20px)",
                        pointerEvents: "all",
                        zIndex: 10,
                        cursor: "default",
                      }} />
                    )}

                    {/* STEMS AI watermark - hide when overlay is shown */}
                    {!showEndOverlay && (
                      <div style={{
                        position: "absolute", bottom: 10, right: 12,
                        background: "rgba(79,70,229,0.8)", backdropFilter: "blur(4px)",
                        borderRadius: 5, padding: "2px 8px",
                        fontSize: 9, fontWeight: 800, color: "white", letterSpacing: "0.1em",
                        pointerEvents: "none", zIndex: 11,
                      }}>STEMS AI</div>
                    )}

                    {/* End of video overlay - appears before video ends */}
                    <VideoEndOverlay
                      show={showEndOverlay}
                      onReplay={handleReplay}
                      onNext={handleNextVideo}
                      hasNext={hasNextVideo}
                      isMobile={isMobile}
                    />
                  </div>

                  {/* Custom Progress Bar */}
                  <div style={{ padding: isMobile ? "0 14px" : "0 16px" }}>
                    <VideoProgressBar
                      currentTime={videoCurrentTime}
                      duration={videoDuration}
                      onSeek={handleSeek}
                      disabled={false}
                      isMobile={isMobile}
                    />
                  </div>

                  <div style={{ padding: isMobile ? "0 14px 14px" : "0 16px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={handlePlayPause}
                        style={{
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 12px",
                          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          opacity: 1,
                        }}
                      >
                        {isVideoPlaying ? <Pause size={14} /> : <Play size={14} />}
                        {isVideoPlaying ? "Pause" : "Play"}
                      </button>
                      {(isVideoEnded || showEndOverlay) && (
                        <span style={{ fontSize: 11, color: "rgba(165,180,252,0.8)" }}>
                          {isVideoEnded ? "Playback ended" : "Lecture ending soon..."}
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#e0e7ff", margin: "0 0 6px", lineHeight: 1.35 }}>
                      {activeVideo.title}
                    </h2>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#818cf8", background: "rgba(99,102,241,0.2)", borderRadius: 20, padding: "2px 10px" }}>
                        {activeVideo.subject}
                      </span>
                      {activeVideo.level && (
                        <span style={{ fontSize: 11, color: "rgba(165,180,252,0.6)", background: "rgba(255,255,255,0.07)", borderRadius: 20, padding: "2px 10px" }}>
                          {activeVideo.level}
                        </span>
                      )}
                      {activeVideo.chapter && (
                        <span style={{ fontSize: 11, color: "rgba(165,180,252,0.5)", background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "2px 10px" }}>
                          {activeVideo.chapter}
                        </span>
                      )}
                    </div>
                    {activeVideo.description && !isMobile && (
                      <p style={{ fontSize: 12, color: "rgba(165,180,252,0.65)", margin: 0, lineHeight: 1.6 }}>
                        {activeVideo.description}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ paddingTop: "42.25%", position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 12,
                  }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Play size={24} style={{ color: "rgba(129,140,248,0.5)", marginLeft: 3 }} />
                    </div>
                    <p style={{ color: "rgba(165,180,252,0.5)", fontSize: isMobile ? 13 : 14, margin: 0, textAlign: "center", padding: "0 20px" }}>
                      Select a lecture to start watching
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Action Buttons */}
            {activeVideo && (
              <div style={{
                background: "white", border: "1.5px solid #e2e8f0",
                borderRadius: isMobile ? 12 : 14, padding: isMobile ? "12px 14px" : "14px 16px",
                marginBottom: isMobile ? 12 : 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: isMobile ? 10 : 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={12} style={{ color: "#7c3aed" }} /> AI Actions
                </p>

                {isMobile ? (
                  <div className="ai-actions-mobile">
                    <AIActionBtn icon={<MessageSquare size={14} />} label="Ask AI About This"
                      onClick={() => callAI("ask")} loading={aiLoading && aiAction === "ask"} color="#4f46e5" fullWidth />
                    <AIActionBtn icon={<FileText size={14} />} label="Generate Notes"
                      onClick={() => callAI("notes")} loading={aiLoading && aiAction === "notes"} color="#0891b2" fullWidth />
                    <AIActionBtn icon={<Sparkles size={14} />} label="Generate MCQs"
                      onClick={() => callAI("mcq")} loading={aiLoading && aiAction === "mcq"} color="#7c3aed" fullWidth />
                    {aiResult && (
                      <>
                        <AIActionBtn icon={<BookMarked size={14} />}
                          label={noteSaved ? "Saved!" : "Save to Revision Notes"}
                          onClick={handleSaveNote} done={noteSaved} color="#eab308" fullWidth />
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <MentorTriggerIcon
                            onClick={() => { setMentorText(aiResult); setActiveSpeech(""); setTimeout(() => setActiveSpeech(aiResult), 30); }}
                            isSpeaking={!!mentorText}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="ai-actions-desktop">
                    <AIActionBtn icon={<MessageSquare size={14} />} label="Ask AI About This"
                      onClick={() => callAI("ask")} loading={aiLoading && aiAction === "ask"} color="#4f46e5" />
                    <AIActionBtn icon={<FileText size={14} />} label="Generate Notes"
                      onClick={() => callAI("notes")} loading={aiLoading && aiAction === "notes"} color="#0891b2" />
                    <AIActionBtn icon={<Sparkles size={14} />} label="Generate MCQs"
                      onClick={() => callAI("mcq")} loading={aiLoading && aiAction === "mcq"} color="#7c3aed" />
                    {aiResult && (
                      <>
                        <AIActionBtn icon={<BookMarked size={14} />}
                          label={noteSaved ? "Saved!" : "Save to Revision Notes"}
                          onClick={handleSaveNote} done={noteSaved} color="#eab308" />
                        <MentorTriggerIcon
                          onClick={() => { setMentorText(aiResult); setActiveSpeech(""); setTimeout(() => setActiveSpeech(aiResult), 30); }}
                          isSpeaking={!!mentorText}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* AI Result */}
                {(aiLoading || aiResult) && (
                  <div style={{
                    marginTop: 14, padding: isMobile ? "12px 14px" : "14px 16px",
                    background: "rgba(30,27,75,0.7)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10, maxHeight: isMobile ? 280 : 380, overflowY: "auto",
                  }}>
                    {aiLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(165,180,252,0.6)" }}>
                        <Loader2 size={16} style={{ animation: "vlspin 1s linear infinite" }} />
                        <span style={{ fontSize: 13 }}>Generating...</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                          {aiAction === "ask" ? "AI Explanation" : aiAction === "notes" ? "Revision Notes" : "MCQ Practice"}
                        </div>
                        <div>{renderAIContent(aiResult)}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Video list */}
          <div>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                All Lectures
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{videos.length} found</span>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Video size={32} style={{ color: "rgba(129,140,248,0.3)", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 4px" }}>No lectures found</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                  {hasFilters ? "Try different filters" : "Lectures will appear here once added"}
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} style={{
                    padding: "8px 16px", borderRadius: 8,
                    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                    color: "#818cf8", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>Clear filters</button>
                )}
              </div>
            ) : (
              <div ref={listRef} className="vl-list-scroll"
                style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 10 }}>
                {visibleVideos.map(video =>
                  isMobile ? (
                    <MobileVideoCard
                      key={video.video_id}
                      video={video}
                      isActive={activeVideo?.video_id === video.video_id}
                      onClick={() => handleVideoClick(video)}
                    />
                  ) : (
                    <VideoCard
                      key={video.video_id}
                      video={video}
                      isActive={activeVideo?.video_id === video.video_id}
                      onClick={() => handleVideoClick(video)}
                    />
                  )
                )}
                {visibleCount < videos.length && (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <Loader2 size={18} style={{ color: "#818cf8", animation: "vlspin 1s linear infinite", display: "block", margin: "0 auto" }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AIMentor floating */}
      <AIMentor
        text={mentorText}
        activeSpeechText={activeSpeech}
        onClose={() => { setMentorText(""); setActiveSpeech(""); }}
      />
    </DashboardLayout>
  );
}
