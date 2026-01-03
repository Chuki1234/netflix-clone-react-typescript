import { useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import { useNavigate } from "react-router-dom";

import { useGetPublicMoviesQuery } from "src/store/slices/publicMovies";
import { MEDIA_TYPE } from "src/types/Common";
import { MAIN_PATH } from "src/constant";

export function Component() {
  const { data, isLoading } = useGetPublicMoviesQuery({ limit: 40 });
  const navigate = useNavigate();

  const tagged = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    return data.map((m) => ({
      ...m,
      isNew: m.createdAt ? now - new Date(m.createdAt).getTime() <= SEVEN_DAYS : true,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pt: { xs: 10, md: 12 },
        pb: 6,
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 3 }}>
          News
        </Typography>
        <Grid container spacing={2}>
          {tagged.map((movie) => {
            const poster = movie.posterPath
              ? movie.posterPath.startsWith("http")
                ? movie.posterPath
                : `https://image.tmdb.org/t/p/w342${movie.posterPath}`
              : "https://via.placeholder.com/342x513?text=No+Image";
            return (
              <Grid item key={movie._id || movie.tmdbId || movie.title} xs={12} sm={6} md={3} lg={2.4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                    cursor: movie.tmdbId ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (movie.tmdbId) {
                      navigate(`/${MAIN_PATH.watch}/${MEDIA_TYPE.Movie}/${movie.tmdbId}`);
                    }
                  }}
                >
                  <CardMedia component="img" image={poster} alt={movie.title} sx={{ height: 240, objectFit: "cover" }} />
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                      {movie.title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "N/A"}
                      </Typography>
                      {movie.isNew && (
                        <Chip label="Phim mới" size="small" color="error" sx={{ height: 20, fontSize: 11 }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {!tagged.length && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Chưa có phim mới.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}

Component.displayName = "NewsPage";

