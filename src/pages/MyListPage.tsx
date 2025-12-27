import { useMemo } from "react";
import { Container, Typography, Grid, Box, CircularProgress } from "@mui/material";
import { useAppSelector } from "src/hooks/redux";
import { selectMyList } from "src/store/slices/userPreferences";
import { useGetAppendedVideosQuery } from "src/store/slices/discover";
import { MEDIA_TYPE } from "src/types/Common";
import VideoItemWithHover from "src/components/VideoItemWithHover";
import { MovieDetail, Movie } from "src/types/Movie";

// Component to fetch and display a single movie
function MovieItem({ movieItem }: { movieItem: { id: number; mediaType: MEDIA_TYPE } }) {
  const { data: movieDetail, isLoading } = useGetAppendedVideosQuery({
    mediaType: movieItem.mediaType,
    id: movieItem.id,
  });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!movieDetail) {
    return null;
  }

  // Convert MovieDetail to Movie format for VideoItemWithHover
  const movie: Movie = {
    id: movieDetail.id,
    title: movieDetail.title,
    overview: movieDetail.overview,
    backdrop_path: movieDetail.backdrop_path,
    poster_path: movieDetail.poster_path,
    release_date: movieDetail.release_date,
    genre_ids: movieDetail.genres.map((g) => g.id),
    adult: movieDetail.adult,
    original_language: movieDetail.original_language,
    original_title: movieDetail.original_title,
    popularity: movieDetail.popularity,
    vote_average: movieDetail.vote_average,
    vote_count: movieDetail.vote_count,
    video: movieDetail.video,
  };

  if (!movie.backdrop_path) {
    return null;
  }

  return (
    <Grid item xs={6} sm={4} md={3} lg={2.4} sx={{ zIndex: 1 }}>
      <VideoItemWithHover video={movie} />
    </Grid>
  );
}

export function Component() {
  const myList = useAppSelector(selectMyList);

  // Filter only movies for now (can be extended for TV shows)
  const movieList = useMemo(() => {
    return myList.filter((item) => item.mediaType === MEDIA_TYPE.Movie);
  }, [myList]);

  return (
    <Container
      maxWidth={false}
      sx={{
        px: { xs: "30px", sm: "60px" },
        pb: 4,
        pt: "150px",
        bgcolor: "inherit",
      }}
    >
      <Typography variant="h4" sx={{ color: "text.primary", mb: 4 }}>
        My List
      </Typography>

      {movieList.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
          }}
        >
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            Your list is empty
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Add movies and TV shows to your list to watch them later
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {movieList.map((movieItem) => (
            <MovieItem key={`${movieItem.mediaType}-${movieItem.id}`} movieItem={movieItem} />
          ))}
        </Grid>
      )}
    </Container>
  );
}

Component.displayName = "MyListPage";

