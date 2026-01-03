import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Card,
  CardMedia,
  Pagination,
  Stack,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useGetConfigurationQuery } from "src/store/slices/configuration";
import { useGetGenresQuery } from "src/store/slices/genre";
import { MEDIA_TYPE } from "src/types/Common";
import { Movie } from "src/types/Movie";
import { TMDB_V3_API_KEY } from "src/constant";
import {
  useGetAdminMoviesQuery,
  useCreateAdminMovieMutation,
  useUpdateAdminMovieMutation,
  useDeleteAdminMovieMutation,
  AdminMovie,
  AdminMoviePayload,
} from "src/store/slices/adminApiSlice";
import { useLazySearchMoviesQuery } from "src/store/slices/discover";

export function Component() {
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchQueryInModal, setSearchQueryInModal] = useState("");
  const [selectedMovieInModal, setSelectedMovieInModal] = useState<Movie | null>(null);
  const [selectedCatalogMovie, setSelectedCatalogMovie] = useState<AdminMovie | null>(null);

  const { data: configuration } = useGetConfigurationQuery(undefined);
  const { data: genresData } = useGetGenresQuery(MEDIA_TYPE.Movie);
  const { data: catalogData, isLoading: isLoadingCatalog, isFetching: isFetchingCatalog } = useGetAdminMoviesQuery(
    {
      page: currentPage,
      limit: 10,
      search: debouncedSearch || undefined,
    },
    { refetchOnMountOrArgChange: true }
  );
  const [triggerSearchMovies, { data: searchResults, isLoading: isLoadingSearch }] = useLazySearchMoviesQuery();
  const [createMovie, { isLoading: isSaving }] = useCreateAdminMovieMutation();
  const [updateMovie, { isLoading: isUpdating }] = useUpdateAdminMovieMutation();
  const [deleteMovie, { isLoading: isDeleting }] = useDeleteAdminMovieMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (searchQueryInModal.trim().length >= 2) {
      const timer = setTimeout(() => {
        triggerSearchMovies({ query: searchQueryInModal, page: 1 });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchQueryInModal, triggerSearchMovies]);

  const moviesToDisplay = catalogData?.items || [];
  const totalPages = catalogData?.pagination.pages || 1;
  const isLoading = isLoadingCatalog || isFetchingCatalog;

  const getGenreName = (id: number) => {
    return genresData?.find((genre) => genre.id === id)?.name || "Unknown";
  };

  const handleAddMovie = () => {
    setSelectedMovieInModal(null);
    setSelectedCatalogMovie(null);
    setSearchQueryInModal("");
    setOpenDialog(true);
  };

  const handleEditMovie = (movie: AdminMovie) => {
    setSelectedCatalogMovie(movie);
    setSelectedMovieInModal({
      id: movie.tmdbId || 0,
      title: movie.title,
      overview: movie.overview || "",
      poster_path: movie.posterPath || "",
      backdrop_path: movie.backdropPath || "",
      release_date: movie.releaseDate || "",
      vote_average: movie.voteAverage || 0,
      vote_count: movie.voteCount || 0,
      genre_ids: movie.genres?.map((g) => g.id) || [],
      media_type: movie.mediaType === "tv" ? MEDIA_TYPE.Tv : MEDIA_TYPE.Movie,
      adult: false,
      original_language: "en",
      original_title: movie.title,
      popularity: 0,
      video: false,
    });
    setSearchQueryInModal(movie.title || "");
    setOpenDialog(true);
  };

  const handleSaveMovie = async () => {
    if (!selectedMovieInModal) return;
    const payload: AdminMoviePayload = {
      tmdbId: selectedMovieInModal.id,
      title: selectedMovieInModal.title,
      overview: selectedMovieInModal.overview,
      posterPath: selectedMovieInModal.poster_path,
      backdropPath: selectedMovieInModal.backdrop_path,
      mediaType: selectedMovieInModal.media_type === MEDIA_TYPE.Tv ? "tv" : "movie",
      releaseDate: selectedMovieInModal.release_date,
      voteAverage: selectedMovieInModal.vote_average,
      voteCount: selectedMovieInModal.vote_count,
      genres: selectedMovieInModal.genre_ids?.map((id) => ({
        id,
        name: getGenreName(id),
      })),
    };
    if (selectedCatalogMovie?._id) {
      await updateMovie({ id: selectedCatalogMovie._id, data: payload });
    } else {
      await createMovie(payload);
    }
    setOpenDialog(false);
    setSelectedMovieInModal(null);
    setSelectedCatalogMovie(null);
    setSearchQueryInModal("");
  };

  const handleDeleteMovie = async (id?: string) => {
    if (!id) return;
    await deleteMovie(id);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ color: "text.primary" }}>
          Movie Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddMovie}>
          Add Movie
        </Button>
      </Box>

      {!TMDB_V3_API_KEY && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          TMDB API Key is not configured. Set VITE_APP_TMDB_V3_API_KEY in your .env.
        </Alert>
      )}

      <Paper>
        <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            label="Search in catalog"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (isLoadingCatalog || isFetchingCatalog) && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Poster</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Genres</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : moviesToDisplay && moviesToDisplay.length > 0 ? (
                moviesToDisplay.map((movie) => (
                  <TableRow key={movie._id}>
                    <TableCell>
                      {configuration?.images.base_url && movie.posterPath ? (
                        <CardMedia
                          component="img"
                          src={`${configuration.images.base_url}w92${movie.posterPath}`}
                          alt={movie.title}
                          sx={{ width: 60, height: 90, objectFit: "cover", borderRadius: 1 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 60,
                            height: 90,
                            bgcolor: "grey.300",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          No Image
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {movie.title}
                      </Typography>
                      {movie.overview && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            mt: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {movie.overview}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {movie.genres?.slice(0, 2).map((genre) => (
                          <Chip key={genre.id} label={genre.name} size="small" variant="outlined" />
                        ))}
                        {movie.genres && movie.genres.length > 2 && (
                          <Chip label={`+${movie.genres.length - 2}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${(movie.voteAverage || 0).toFixed(1)} ⭐`}
                        size="small"
                        color={(movie.voteAverage || 0) >= 7 ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleEditMovie(movie)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteMovie(movie._id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No movies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedCatalogMovie ? "Edit Movie" : "Add New Movie"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <MovieSearchAutocomplete
                onSelectMovie={setSelectedMovieInModal}
                configuration={configuration}
                initialSearchQuery={selectedMovieInModal?.title || ""}
                onInputChange={setSearchQueryInModal}
                isLoading={isLoadingSearch}
                results={searchResults?.results || []}
              />
            </Grid>
            {selectedMovieInModal && (
              <>
                <Grid item xs={12} sm={4}>
                  {configuration?.images.base_url && selectedMovieInModal.poster_path ? (
                    <Card>
                      <CardMedia
                        component="img"
                        image={`${configuration.images.base_url}w342${selectedMovieInModal.poster_path}`}
                        alt={selectedMovieInModal.title}
                        sx={{ height: 300, objectFit: "cover" }}
                      />
                    </Card>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        bgcolor: "grey.300",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 1,
                      }}
                    >
                      No Poster
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField fullWidth label="Title" variant="outlined" value={selectedMovieInModal.title} disabled sx={{ mb: 2 }} />
                  <TextField
                    fullWidth
                    label="Release Date"
                    variant="outlined"
                    value={selectedMovieInModal.release_date || "N/A"}
                    disabled
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Rating"
                    variant="outlined"
                    value={`${selectedMovieInModal.vote_average?.toFixed(1) || "0.0"} / 10`}
                    disabled
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    variant="outlined"
                    value={selectedMovieInModal.overview || "No description available"}
                    disabled
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveMovie} variant="contained" disabled={isSaving || isUpdating || !selectedMovieInModal}>
            {selectedCatalogMovie ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function MovieSearchAutocomplete({
  onSelectMovie,
  configuration,
  initialSearchQuery,
  onInputChange,
  isLoading,
  results,
}: {
  onSelectMovie: (movie: Movie) => void;
  configuration: any;
  initialSearchQuery: string;
  onInputChange: (value: string) => void;
  isLoading: boolean;
  results: Movie[];
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const options = results || [];

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.title || ""}
      loading={isLoading}
      onInputChange={(_event, newValue) => {
        setSearchQuery(newValue);
        onInputChange(newValue);
      }}
      onChange={(_event, newValue) => {
        if (newValue) {
          onSelectMovie(newValue as Movie);
        }
      }}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
            {configuration?.images.base_url && option.poster_path ? (
              <CardMedia
                component="img"
                image={`${configuration.images.base_url}w92${option.poster_path}`}
                alt={option.title}
                sx={{ width: 50, height: 75, objectFit: "cover", borderRadius: 1 }}
              />
            ) : (
              <Box
                sx={{
                  width: 50,
                  height: 75,
                  bgcolor: "grey.300",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                No Image
              </Box>
            )}
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.release_date ? new Date(option.release_date).getFullYear() : "N/A"}
              </Typography>
            </Box>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search TMDB movies"
          variant="outlined"
          placeholder="Type at least 2 characters to search..."
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

