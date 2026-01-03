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

const getCurrentUserId = (): string | null => {
  try {
    const userStr = sessionStorage.getItem("user") ?? localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?._id || null;
    }
  } catch (err) {
    console.error("Error reading user from storage:", err);
  }
  return null;
};

const storageKey = (base: string, userId: string | null) =>
  userId ? `${base}_${userId}` : `${base}_guest`;

const loadFromLocalStorage = (userId: string | null): UserPreferencesState => {
  try {
    const likedKey = storageKey("netflix_liked_movies", userId);
    const listKey = storageKey("netflix_my_list", userId);
    const likedMoviesStr = localStorage.getItem(likedKey);
    const myListStr = localStorage.getItem(listKey);
    return {
      likedMovies: likedMoviesStr ? JSON.parse(likedMoviesStr) : [],
      myList: myListStr ? JSON.parse(myListStr) : [],
    };
  } catch (error) {
    console.error("Error loading preferences:", error);
    return { likedMovies: [], myList: [] };
  }
};

const saveToLocalStorage = (base: string, userId: string | null, value: MovieItem[]) => {
  try {
    const key = storageKey(base, userId);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

const initialState: UserPreferencesState = loadFromLocalStorage(getCurrentUserId());

const userPreferencesSlice = createSlice({
  name: "userPreferences",
  initialState,
  reducers: {
    loadForUser: (state, action: PayloadAction<string | null | undefined>) => {
      const prefs = loadFromLocalStorage(action.payload ?? null);
      state.likedMovies = prefs.likedMovies;
      state.myList = prefs.myList;
    },
    toggleLike: (state, action: PayloadAction<MovieItem>) => {
      const { id, mediaType } = action.payload;
      const userId = getCurrentUserId();
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

      saveToLocalStorage("netflix_liked_movies", userId, state.likedMovies);
    },
    toggleMyList: (state, action: PayloadAction<MovieItem>) => {
      const { id, mediaType } = action.payload;
      const userId = getCurrentUserId();
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

      saveToLocalStorage("netflix_my_list", userId, state.myList);
    },
  },
});

export const { toggleLike, toggleMyList, loadForUser } = userPreferencesSlice.actions;

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

