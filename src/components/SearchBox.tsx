import { useEffect, useRef, useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  InputBase,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";
import { MEDIA_TYPE } from "src/types/Common";
import { useLazySearchMoviesQuery } from "src/store/slices/discover";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  display: "flex",
  alignItems: "center",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  cursor: "pointer",
  padding: theme.spacing(0, 1),
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .NetflixInputBase-input": {
    width: 0,
    transition: theme.transitions.create("width", {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }),
  },
}));

export default function SearchBox() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [openResults, setOpenResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>();
  const navigate = useNavigate();
  const [triggerSearch, { data, isFetching }] = useLazySearchMoviesQuery();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      triggerSearch({ query: debouncedQuery, page: 1 });
      setOpenResults(true);
    } else {
      setOpenResults(false);
    }
  }, [debouncedQuery, triggerSearch]);

  const handleClickSearchIcon = () => {
    if (!isFocused) {
      searchInputRef.current?.focus();
    }
  };

  const handleSelect = (id: number) => {
    setOpenResults(false);
    setQuery("");
    setDebouncedQuery("");
    navigate(`/${MAIN_PATH.watch}/${MEDIA_TYPE.Movie}/${id}`);
  };

  return (
    <Box sx={{ position: "relative", minWidth: 46 }}>
      <Search
        sx={{
          border: isFocused ? "1px solid white" : "1px solid transparent",
          backgroundColor: isFocused ? "black" : "transparent",
          borderRadius: 1,
          transition: "all 0.2s ease",
          minHeight: 36,
          px: 0.5,
          width: isFocused ? 280 : 46,
        }}
      >
        <SearchIconWrapper onClick={handleClickSearchIcon}>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          inputRef={searchInputRef}
          placeholder="Titles, people, genres"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setOpenResults(false);
          }}
          inputProps={{
            "aria-label": "search",
            className: "NetflixInputBase-input",
            style: {
              width: isFocused ? "100%" : 0,
            },
          }}
        />
      </Search>
      {openResults && (
        <Paper
          elevation={6}
          sx={{
            position: "absolute",
            top: "42px",
            right: 0,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 1200,
            bgcolor: "background.paper",
          }}
        >
          {isFetching ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : data?.results?.length ? (
            <List dense>
              {data.results.slice(0, 8).map((item) => (
                <ListItem
                  key={item.id}
                  button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item.id)}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={
                        item.poster_path
                          ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                          : undefined
                      }
                      sx={{ width: 40, height: 60 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      item.release_date
                        ? new Date(item.release_date).getFullYear()
                        : "N/A"
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, color: "text.secondary" }}>No results</Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
