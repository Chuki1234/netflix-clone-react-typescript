import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useGetGenresQuery } from "src/store/slices/genre";
import {
  useGetVideosByMediaTypeAndGenreIdQuery,
  useGetVideosByMediaTypeAndCustomGenreQuery,
} from "src/store/slices/discover";
import { MEDIA_TYPE } from "src/types/Common";
import { useGetConfigurationQuery } from "src/store/slices/configuration";
import { useDetailModal } from "src/providers/DetailModalProvider";

const FALLBACK_IMAGE = "https://via.placeholder.com/342x513?text=No+Image";

export function Component() {
  // "popular" is default, numbers are TMDB genre IDs
  const [selected, setSelected] = useState<string | number>("popular");
  const { data: genres } = useGetGenresQuery(MEDIA_TYPE.Movie);
  const { data: configuration } = useGetConfigurationQuery(undefined);
  const { setDetailType } = useDetailModal();

  const {
    data: byGenre,
    isLoading: loadingGenre,
    refetch: refetchGenre,
  } = useGetVideosByMediaTypeAndGenreIdQuery(
    { mediaType: MEDIA_TYPE.Movie, genreId: Number(selected), page: 1 },
    { skip: selected === "popular" }
  );

  const { data: popular, isLoading: loadingPopular } =
    useGetVideosByMediaTypeAndCustomGenreQuery({
      mediaType: MEDIA_TYPE.Movie,
      apiString: "popular",
      page: 1,
    });

  useEffect(() => {
    if (selected !== "popular") refetchGenre();
  }, [selected, refetchGenre]);

  const imageBase = configuration?.images.base_url || "https://image.tmdb.org/t/p/";

  const genreOptions = useMemo(() => genres || [], [genres]);

  const isPopular = selected === "popular";
  const cards = useMemo(
    () => (isPopular ? popular?.results || [] : byGenre?.results || []),
    [isPopular, popular?.results, byGenre?.results]
  );

  const currentTitle = isPopular
    ? "Popular now"
    : genreOptions.find((g) => g.id === Number(selected))?.name || "By genre";

  const isLoading = isPopular ? loadingPopular : loadingGenre;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pt: { xs: 10, md: 12 }, // extra top padding to clear navbar
        pb: 6,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            gap: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "common.white" }}>
            Movies
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Genre</InputLabel>
            <Select
              label="Genre"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <MenuItem value="popular">Popular now</MenuItem>
              {genreOptions.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Main list: either Popular or selected Genre */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "common.white" }}>
            {currentTitle}
          </Typography>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : cards.length ? (
            <Grid container spacing={2}>
              {cards.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={3} lg={2.4}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "background.paper",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setDetailType({ mediaType: MEDIA_TYPE.Movie, id: item.id })
                    }
                  >
                    <CardMedia
                      component="img"
                      image={
                        item.poster_path
                          ? `${imageBase}w342${item.poster_path}`
                          : FALLBACK_IMAGE
                      }
                      alt={item.title}
                      sx={{ height: 240, objectFit: "cover" }}
                    />
                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                        {item.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {item.release_date ? new Date(item.release_date).getFullYear() : "N/A"}
                        </Typography>
                        <Chip label={`${item.vote_average.toFixed(1)} ⭐`} size="small" />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
              No movies found.
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

