import { apiSlice } from "./apiSlice";
import { Movie } from "src/types/Movie";

export const publicMoviesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPublicMovies: builder.query<Movie[], { limit?: number }>({
      query: ({ limit = 20 } = {}) => ({
        url: "/movies",
        params: { limit },
      }),
      providesTags: ["PublicMovies"],
    }),
  }),
});

export const { useGetPublicMoviesQuery } = publicMoviesApi;

