import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MEDIA_TYPE } from "src/types/Common";

interface MovieItem {
  id: number;
  mediaType: MEDIA_TYPE;
}

interface UserPreferencesState {
  likedMovies: MovieItem[];
  myList: MovieItem[];
}

// Load from localStorage on initialization
const loadFromLocalStorage = (): UserPreferencesState => {
  try {
    const likedMoviesStr = localStorage.getItem("netflix_liked_movies");
    const myListStr = localStorage.getItem("netflix_my_list");
    return {
      likedMovies: likedMoviesStr ? JSON.parse(likedMoviesStr) : [],
      myList: myListStr ? JSON.parse(myListStr) : [],
    };
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return {
      likedMovies: [],
      myList: [],
    };
  }
};

// Save to localStorage helper
const saveToLocalStorage = (key: string, value: MovieItem[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

const initialState: UserPreferencesState = loadFromLocalStorage();

const userPreferencesSlice = createSlice({
  name: "userPreferences",
  initialState,
  reducers: {
    toggleLike: (state, action: PayloadAction<MovieItem>) => {
      const { id, mediaType } = action.payload;
      const existingIndex = state.likedMovies.findIndex(
        (item) => item.id === id && item.mediaType === mediaType
      );

      if (existingIndex >= 0) {
        // Remove from liked
        state.likedMovies.splice(existingIndex, 1);
      } else {
        // Add to liked
        state.likedMovies.push({ id, mediaType });
      }

      saveToLocalStorage("netflix_liked_movies", state.likedMovies);
    },
    toggleMyList: (state, action: PayloadAction<MovieItem>) => {
      const { id, mediaType } = action.payload;
      const existingIndex = state.myList.findIndex(
        (item) => item.id === id && item.mediaType === mediaType
      );

      if (existingIndex >= 0) {
        // Remove from list
        state.myList.splice(existingIndex, 1);
      } else {
        // Add to list
        state.myList.push({ id, mediaType });
      }

      saveToLocalStorage("netflix_my_list", state.myList);
    },
  },
});

export const { toggleLike, toggleMyList } = userPreferencesSlice.actions;

// Selectors
export const selectIsLiked = (state: { userPreferences: UserPreferencesState }, id: number, mediaType: MEDIA_TYPE) =>
  state.userPreferences.likedMovies.some(
    (item) => item.id === id && item.mediaType === mediaType
  );

export const selectIsInMyList = (state: { userPreferences: UserPreferencesState }, id: number, mediaType: MEDIA_TYPE) =>
  state.userPreferences.myList.some(
    (item) => item.id === id && item.mediaType === mediaType
  );

export const selectMyList = (state: { userPreferences: UserPreferencesState }) =>
  state.userPreferences.myList;

export const selectLikedMovies = (state: { userPreferences: UserPreferencesState }) =>
  state.userPreferences.likedMovies;

export default userPreferencesSlice.reducer;

