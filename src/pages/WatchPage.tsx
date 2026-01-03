import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import Player from "video.js/dist/types/player";
import { Box, Stack, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import SettingsIcon from "@mui/icons-material/Settings";
import BrandingWatermarkOutlinedIcon from "@mui/icons-material/BrandingWatermarkOutlined";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

import useWindowSize from "src/hooks/useWindowSize";
import { formatTime } from "src/utils/common";
import { useGetAppendedVideosQuery } from "src/store/slices/discover";
import { MEDIA_TYPE } from "src/types/Common";
import { useSubscriptionCheck } from "src/hooks/useSubscriptionCheck";
import { MAIN_PATH } from "src/constant";

import MaxLineTypography from "src/components/MaxLineTypography";
import VolumeControllers from "src/components/watch/VolumeControllers";
import VideoJSPlayer from "src/components/watch/VideoJSPlayer";
import PlayerSeekbar from "src/components/watch/PlayerSeekbar";
import PlayerControlButton from "src/components/watch/PlayerControlButton";
import MainLoadingScreen from "src/components/MainLoadingScreen";
import {
  useGetWatchHistoryByMovieQuery,
  useSaveWatchHistoryMutation,
} from "src/store/slices/watchHistoryApi";

export function Component() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>();
  const movieMediaType = (mediaType as MEDIA_TYPE) || MEDIA_TYPE.Movie;
  const movieId = id ? parseInt(id, 10) : 0;
  const { isActive } = useSubscriptionCheck();

  const {
    data: movieDetail,
    isLoading,
    isError,
  } = useGetAppendedVideosQuery(
    { mediaType: movieMediaType, id: movieId },
    { skip: !movieId }
  );
  const playerRef = useRef<Player | null>(null);
  const [playerState, setPlayerState] = useState({
    paused: true,
    muted: true,
    playedSeconds: 0,
    duration: 0,
    volume: 0.8,
    loaded: 0,
  });

  const navigate = useNavigate();
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const hideUiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedProgressRef = useRef(false);
  const saveProgressRef = useRef<(() => Promise<void> | void) | null>(null);

  const windowSize = useWindowSize();

  const { data: watchHistory } = useGetWatchHistoryByMovieQuery(
    { movieId, mediaType: movieMediaType },
    { skip: !movieId || !isActive }
  );
  const [saveWatchHistory] = useSaveWatchHistoryMutation();

  // Redirect if subscription is not active
  if (!isActive) {
    return <Navigate to={`/${MAIN_PATH.browse}`} replace />;
  }

  // Get YouTube trailer key from movie detail
  const trailerKey = useMemo(() => {
    if (movieDetail?.videos?.results && movieDetail.videos.results.length > 0) {
      // Find trailer video (usually the first one or one with type "Trailer")
      const trailer = movieDetail.videos.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      );
      return trailer?.key || movieDetail.videos.results[0]?.key;
    }
    return null;
  }, [movieDetail]);

  const videoJsOptions = useMemo(() => {
    const sources = trailerKey
      ? [
          {
            type: "video/youtube",
            src: `https://www.youtube.com/watch?v=${trailerKey}`,
          },
        ]
      : [
          {
            // Fallback to sample video if no trailer available
            src: "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
            type: "application/x-mpegurl",
          },
        ];

    return {
      preload: "metadata",
      autoplay: true,
      controls: false,
      width: windowSize.width,
      height: windowSize.height,
      techOrder: trailerKey ? ["youtube"] : undefined,
      sources,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize, trailerKey]);

  const handlePlayerReady = function (player: Player): void {
    player.on("pause", () => {
      setPlayerState((draft) => {
        return { ...draft, paused: true };
      });
      // Show controls while paused
      setUiVisible(true);
      if (hideUiTimer.current) {
        clearTimeout(hideUiTimer.current);
        hideUiTimer.current = null;
      }
    });

    player.on("play", () => {
      setPlayerState((draft) => {
        return { ...draft, paused: false };
      });
      // Start auto-hide controls after 3s when playing
      if (hideUiTimer.current) {
        clearTimeout(hideUiTimer.current);
      }
      hideUiTimer.current = setTimeout(() => {
        setUiVisible(false);
      }, 3000);
    });

    player.on("timeupdate", () => {
      const current = player.currentTime() ?? 0;
      setPlayerState((draft) => {
        return { ...draft, playedSeconds: current };
      });
    });

    player.one("durationchange", () => {
      setPlayerInitialized(true);
      const dur = player.duration() ?? 0;
      setPlayerState((draft) => ({ ...draft, duration: dur }));
      // Auto-hide once video is ready after initial 3s
      if (hideUiTimer.current) {
        clearTimeout(hideUiTimer.current);
      }
      hideUiTimer.current = setTimeout(() => {
        setUiVisible(false);
      }, 3000);
    });

    playerRef.current = player;

    player.muted(true);
    const playPromise = player.play?.();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // autoplay may fail; keep UI visible and wait for user
        setUiVisible(true);
      });
    }
    setPlayerState((draft) => {
      return { ...draft, paused: player.paused(), muted: player.muted() ?? true };
    });
  };

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    const vol = Array.isArray(value) ? value[0] : value;
    playerRef.current?.volume(vol / 100);
    setPlayerState((draft) => {
      return { ...draft, volume: vol / 100 };
    });
  };

  const handleSeekTo = (v: number) => {
    playerRef.current?.currentTime(v);
  };

  const handleGoBack = () => {
    navigate("/browse");
  };

  // Redirect if no valid ID
  useEffect(() => {
    if (!movieId || isNaN(movieId)) {
      navigate("/browse");
    }
  }, [movieId, navigate]);

  useEffect(() => {
    return () => {
      if (hideUiTimer.current) {
        clearTimeout(hideUiTimer.current);
      }
      saveProgressRef.current?.();
    };
  }, []);

  const handleUserInteraction = useCallback(() => {
    setUiVisible(true);
    const playerInstance = playerRef.current;
    if (!playerInstance) return;
    const p = playerInstance as Player;
    if (typeof p.muted === "function" && p.muted()) {
      p.muted(false);
      if (typeof p.play === "function") {
        const playResult = p.play();
        if (playResult && typeof (playResult as Promise<void>).catch === "function") {
          (playResult as Promise<void>).catch(() => {});
        }
      }
      const paused = typeof p.paused === "function" ? p.paused() : false;
      setPlayerState((draft) => ({ ...draft, muted: false, paused }));
    }
    if (hideUiTimer.current) {
      clearTimeout(hideUiTimer.current);
    }
    hideUiTimer.current = setTimeout(() => {
      setUiVisible(false);
    }, 2000);
  }, []);

  // Capture mouse move even when iframe consumes events
  useEffect(() => {
    const listener = () => handleUserInteraction();
    window.addEventListener("mousemove", listener);
    return () => window.removeEventListener("mousemove", listener);
  }, [handleUserInteraction]);

  const saveProgress = useCallback(async () => {
    const playerInstance = playerRef.current;
    if (!playerInstance || !movieId || !isActive) return;
    const current = playerInstance.currentTime?.() ?? 0;
    const duration = playerInstance.duration?.() ?? 0;
    if (duration <= 0) return;
    const progress = Math.max(0, Math.round(current));
    const total = Math.max(0, Math.round(duration));
    try {
      await saveWatchHistory({
        movieId,
        mediaType: movieMediaType,
        progress,
        duration: total,
        completed: false,
      }).unwrap();
    } catch (error) {
      console.error("Failed to save watch progress", error);
    }
  }, [isActive, movieId, movieMediaType, saveWatchHistory]);

  useEffect(() => {
    saveProgressRef.current = () => {
      void saveProgress();
    };
  }, [saveProgress]);

  useEffect(() => {
    const handleBeforeUnload = () => saveProgressRef.current?.();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveProgressRef.current?.();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!playerInitialized || !watchHistory || appliedProgressRef.current) return;
    if (playerRef.current && typeof playerRef.current.currentTime === "function") {
      const duration = playerRef.current.duration?.() ?? watchHistory.duration ?? 0;
      const target = Math.min(watchHistory.progress ?? 0, duration > 1 ? duration - 1 : watchHistory.progress ?? 0);
      if (target > 0) {
        playerRef.current.currentTime(target);
        setPlayerState((draft) => ({
          ...draft,
          playedSeconds: target,
          duration: duration || draft.duration,
        }));
      }
    }
    appliedProgressRef.current = true;
  }, [playerInitialized, watchHistory]);

  // Show loading screen while fetching data
  if (isLoading) {
    return <MainLoadingScreen />;
  }

  // Show error or redirect if movie not found
  if (isError || !movieDetail) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "white",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Không tìm thấy phim
        </Typography>
        <PlayerControlButton onClick={handleGoBack}>
          Quay lại
        </PlayerControlButton>
      </Box>
    );
  }

  if (!!videoJsOptions.width && movieDetail) {
    return (
      <Box
        sx={{
          position: "relative",
        }}
        onMouseMove={handleUserInteraction}
        onClick={handleUserInteraction}
      >
        <VideoJSPlayer options={videoJsOptions} onReady={handlePlayerReady} />
        {playerRef.current && playerInitialized && (
          <Box
            sx={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              position: "absolute",
              opacity: uiVisible ? 1 : 0,
              pointerEvents: uiVisible ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
          >
            <Box px={2} sx={{ position: "absolute", top: 75 }}>
              <PlayerControlButton onClick={handleGoBack}>
                <KeyboardBackspaceIcon />
              </PlayerControlButton>
            </Box>
            <Box
              px={2}
              sx={{
                position: "absolute",
                top: { xs: "40%", sm: "55%", md: "60%" },
                left: 0,
              }}
            >
              <MaxLineTypography
                variant="h3"
                maxLine={1}
                sx={{
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {movieDetail.title || "Title"}
              </MaxLineTypography>
            </Box>
            <Box
              px={{ xs: 0, sm: 1, md: 2 }}
              sx={{
                position: "absolute",
                top: { xs: "50%", sm: "60%", md: "70%" },
                right: 0,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  px: 1,
                  py: 0.5,
                  fontWeight: 700,
                  color: "white",
                  bgcolor: "red",
                  borderRadius: "12px 0px 0px 12px",
                }}
              >
                12+
              </Typography>
            </Box>

            <Box
              px={{ xs: 1, sm: 2 }}
              sx={{ position: "absolute", bottom: 20, left: 0, right: 0 }}
            >
              {/* Seekbar */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <PlayerSeekbar
                  playedSeconds={playerState.playedSeconds}
                  duration={playerState.duration}
                  seekTo={handleSeekTo}
                />
              </Stack>
              {/* end Seekbar */}

              {/* Controller */}
              <Stack direction="row" alignItems="center">
                {/* left controller */}
                <Stack
                  direction="row"
                  spacing={{ xs: 0.5, sm: 1.5, md: 2 }}
                  alignItems="center"
                >
                  {!playerState.paused ? (
                    <PlayerControlButton
                      onClick={() => {
                        playerRef.current?.pause();
                      }}
                    >
                      <PauseIcon />
                    </PlayerControlButton>
                  ) : (
                    <PlayerControlButton
                      onClick={() => {
                        playerRef.current?.play();
                      }}
                    >
                      <PlayArrowIcon />
                    </PlayerControlButton>
                  )}
                  <PlayerControlButton>
                    <SkipNextIcon />
                  </PlayerControlButton>
                  <VolumeControllers
                    muted={playerState.muted}
                    handleVolumeToggle={() => {
                      playerRef.current?.muted(!playerState.muted);
                      setPlayerState((draft) => {
                        return { ...draft, muted: !draft.muted };
                      });
                    }}
                    value={playerState.volume}
                    handleVolume={handleVolumeChange}
                  />
                  <Typography variant="caption" sx={{ color: "white" }}>
                    {`${formatTime(playerState.playedSeconds)} / ${formatTime(
                      playerState.duration
                    )}`}
                  </Typography>
                </Stack>
                {/* end left controller */}

                {/* middle time */}
                <Box flexGrow={1}>
                  <MaxLineTypography
                    maxLine={1}
                    variant="subtitle1"
                    textAlign="center"
                    sx={{ maxWidth: 300, mx: "auto", color: "white" }}
                  >
                    {movieDetail.overview || "Description"}
                  </MaxLineTypography>
                </Box>
                {/* end middle time */}

                {/* right controller */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={{ xs: 0.5, sm: 1.5, md: 2 }}
                >
                  <PlayerControlButton>
                    <SettingsIcon />
                  </PlayerControlButton>
                  <PlayerControlButton>
                    <BrandingWatermarkOutlinedIcon />
                  </PlayerControlButton>
                  <PlayerControlButton>
                    <FullscreenIcon />
                  </PlayerControlButton>
                </Stack>
                {/* end right controller */}
              </Stack>
              {/* end Controller */}
            </Box>
          </Box>
        )}
      </Box>
    );
  }
  return null;
}

Component.displayName = "WatchPage";
