import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Movie } from "src/types/Movie";
import { usePortal } from "src/providers/PortalProvider";
import { useDetailModal } from "src/providers/DetailModalProvider";
import { formatMinuteToReadable, getRandomNumber } from "src/utils/common";
import NetflixIconButton from "./NetflixIconButton";
import MaxLineTypography from "./MaxLineTypography";
import AgeLimitChip from "./AgeLimitChip";
import QualityChip from "./QualityChip";
import GenreBreadcrumbs from "./GenreBreadcrumbs";
import { useGetConfigurationQuery } from "src/store/slices/configuration";
import { MEDIA_TYPE } from "src/types/Common";
import { useGetGenresQuery } from "src/store/slices/genre";
import { MAIN_PATH } from "src/constant";
import { useAppDispatch, useAppSelector } from "src/hooks/redux";
import { toggleLike, toggleMyList, selectIsLiked, selectIsInMyList } from "src/store/slices/userPreferences";
import { useSubscriptionCheck } from "src/hooks/useSubscriptionCheck";
import SubscriptionAlert from "./SubscriptionAlert";
import { useGetWatchHistoryByMovieQuery } from "src/store/slices/watchHistoryApi";
import { selectCurrentUser } from "src/store/slices/authSlice";

interface VideoCardModalProps {
  video: Movie;
  anchorElement: HTMLElement;
}

export default function VideoCardModal({
  video,
  anchorElement,
}: VideoCardModalProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isActive } = useSubscriptionCheck();
  const [showAlert, setShowAlert] = useState(false);

  const { data: configuration } = useGetConfigurationQuery(undefined);
  const { data: genres } = useGetGenresQuery(MEDIA_TYPE.Movie);
  const setPortal = usePortal();
  const rect = anchorElement.getBoundingClientRect();
  const { setDetailType } = useDetailModal();
  const currentUser = useAppSelector(selectCurrentUser);

  const { data: watchHistory } = useGetWatchHistoryByMovieQuery(
    { movieId: video.id, mediaType: MEDIA_TYPE.Movie },
    { skip: !currentUser?._id }
  );

  const isLiked = useAppSelector((state) =>
    selectIsLiked(state, video.id, MEDIA_TYPE.Movie)
  );

  const isInMyList = useAppSelector((state) =>
    selectIsInMyList(state, video.id, MEDIA_TYPE.Movie)
  );

  const handleToggleLike = () => {
    dispatch(toggleLike({ id: video.id, mediaType: MEDIA_TYPE.Movie }));
  };

  const handleToggleMyList = () => {
    dispatch(toggleMyList({ id: video.id, mediaType: MEDIA_TYPE.Movie }));
  };

  const handlePlayClick = () => {
    if (!isActive) {
      setShowAlert(true);
      return;
    }
    navigate(`/${MAIN_PATH.watch}/${MEDIA_TYPE.Movie}/${video.id}`);
  };

  return (
    <Card
      onPointerLeave={() => {
        setPortal(null, null);
      }}
      sx={{
        width: rect.width * 1.5,
        height: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          position: "relative",
          paddingTop: "calc(9 / 16 * 100%)",
        }}
      >
        <img
          src={`${configuration?.images.base_url}w780${video.backdrop_path}`}
          style={{
            top: 0,
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            backgroundPosition: "50%",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            left: 0,
            right: 0,
            bottom: 0,
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingBottom: "4px",
            position: "absolute",
          }}
        >
          <MaxLineTypography
            maxLine={2}
            sx={{ width: "80%", fontWeight: 700 }}
            variant="h6"
          >
            {video.title}
          </MaxLineTypography>
          <div style={{ flexGrow: 1 }} />
          <NetflixIconButton>
            <VolumeUpIcon />
          </NetflixIconButton>
        </div>
      </div>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <NetflixIconButton
              sx={{ p: 0 }}
              onClick={handlePlayClick}
            >
              <PlayCircleIcon sx={{ width: 40, height: 40 }} />
            </NetflixIconButton>
            <NetflixIconButton
              onClick={handleToggleMyList}
              sx={{
                border: isInMyList ? "2px solid white" : "2px solid rgba(255,255,255,0.5)",
                bgcolor: isInMyList ? "white" : "transparent",
                "&:hover": {
                  bgcolor: isInMyList ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)",
                },
              }}
            >
              {isInMyList ? (
                <CheckIcon sx={{ color: "black", fontSize: 20 }} />
              ) : (
                <AddIcon />
              )}
            </NetflixIconButton>
            <NetflixIconButton onClick={handleToggleLike}>
              {isLiked ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
            </NetflixIconButton>
            <div style={{ flexGrow: 1 }} />
            <NetflixIconButton
              onClick={() => {
                setDetailType({ mediaType: MEDIA_TYPE.Movie, id: video.id });
              }}
            >
              <ExpandMoreIcon />
            </NetflixIconButton>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="subtitle1"
              sx={{ color: "success.main" }}
            >{`${getRandomNumber(100)}% Match`}</Typography>
            <AgeLimitChip label={`${getRandomNumber(20)}+`} />
            <Typography variant="subtitle2">{`${formatMinuteToReadable(
              getRandomNumber(180)
            )}`}</Typography>
            <QualityChip label="HD" />
          </Stack>
          {genres && (
            <GenreBreadcrumbs
              genres={genres
                .filter((genre) => video.genre_ids.includes(genre.id))
                .map((genre) => genre.name)}
            />
          )}
          {watchHistory && watchHistory.duration > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                }}
              >
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    100,
                    Math.max(0, (watchHistory.progress / watchHistory.duration) * 100)
                  )}
                  sx={{
                    height: 4,
                    borderRadius: 4,
                    bgcolor: "#2b2b2b",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#e50914",
                    },
                  }}
                />
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Watching
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`${Math.floor(watchHistory.progress / 60)} / ${Math.floor(
                    watchHistory.duration / 60
                  )} ph`}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
      <SubscriptionAlert open={showAlert} onClose={() => setShowAlert(false)} />
    </Card>
  );
}
