import { useState } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

export function Component() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);

  // Mock data - sẽ được thay thế bằng API call
  const movies = [
    {
      id: 1,
      title: "Example Movie",
      category: "Action",
      year: 2023,
      status: "active",
    },
  ];

  const handleAddMovie = () => {
    setEditingMovie(null);
    setOpenDialog(true);
  };

  const handleEditMovie = (movie: any) => {
    setEditingMovie(movie);
    setOpenDialog(true);
  };

  const handleDeleteMovie = (id: number) => {
    // TODO: Implement delete functionality
    console.log("Delete movie:", id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMovie(null);
  };

  const handleSaveMovie = () => {
    // TODO: Implement save functionality
    console.log("Save movie:", editingMovie);
    handleCloseDialog();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ color: "text.primary" }}>
          Movie Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddMovie}
        >
          Add Movie
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Search movies"
          variant="outlined"
          placeholder="Search by title, category..."
        />
      </Paper>

      {/* Movies Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>{movie.id}</TableCell>
                    <TableCell>{movie.title}</TableCell>
                    <TableCell>{movie.category}</TableCell>
                    <TableCell>{movie.year}</TableCell>
                    <TableCell>
                      <Chip
                        label={movie.status}
                        color={movie.status === "active" ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditMovie(movie)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteMovie(movie.id)}
                      >
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
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMovie ? "Edit Movie" : "Add New Movie"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                variant="outlined"
                defaultValue={editingMovie?.title || ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                variant="outlined"
                defaultValue={editingMovie?.category || ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                variant="outlined"
                defaultValue={editingMovie?.year || ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                variant="outlined"
                defaultValue={editingMovie?.description || ""}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveMovie} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

