import { useState } from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useNavigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";
import { MEDIA_TYPE } from "src/types/Common";
import { useSubscriptionCheck } from "src/hooks/useSubscriptionCheck";
import SubscriptionAlert from "./SubscriptionAlert";

interface PlayButtonProps extends ButtonProps {
  movieId?: number;
  mediaType?: MEDIA_TYPE;
}

export default function PlayButton({
  sx,
  movieId,
  mediaType = MEDIA_TYPE.Movie,
  ...others
}: PlayButtonProps) {
  const navigate = useNavigate();
  const { isActive } = useSubscriptionCheck();
  const [showAlert, setShowAlert] = useState(false);

  const handleClick = () => {
    // Check subscription status before navigating
    if (!isActive) {
      setShowAlert(true);
      return;
    }

    if (movieId) {
      navigate(`/${MAIN_PATH.watch}/${mediaType}/${movieId}`);
    } else {
      // Fallback to browse if no movieId provided
      navigate(`/${MAIN_PATH.browse}`);
    }
  };

  return (
    <>
    <Button
      variant="contained"
      startIcon={
        <PlayArrowIcon
          sx={{
            fontSize: {
              xs: "24px !important",
              sm: "32px !important",
              md: "40px !important",
            },
          }}
        />
      }
      {...others}
      sx={{
        px: { xs: 1, sm: 2 },
        py: { xs: 0.5, sm: 1 },
        fontSize: { xs: 18, sm: 24, md: 28 },
        lineHeight: 1.5,
        fontWeight: "bold",
        whiteSpace: "nowrap",
        textTransform: "capitalize",
        bgcolor: "white",
        color: "black",
        "&:hover": {
          bgcolor: "rgba(255, 255, 255, 0.8)",
        },
        ...sx,
      }}
      onClick={handleClick}
    >
      Play
    </Button>
      <SubscriptionAlert open={showAlert} onClose={() => setShowAlert(false)} />
    </>
  );
}
