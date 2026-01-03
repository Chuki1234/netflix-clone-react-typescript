import { apiSlice } from "./apiSlice";
import { MEDIA_TYPE } from "src/types/Common";

export interface WatchHistory {
  _id?: string;
  userId?: string;
  movieId: number;
  mediaType: MEDIA_TYPE;
  progress: number;
  duration: number;
  completed: boolean;
  lastWatchedAt?: string;
}

interface GetWatchHistoryParams {
  movieId: number;
  mediaType: MEDIA_TYPE;
}

interface SaveWatchHistoryPayload extends GetWatchHistoryParams {
  progress: number;
  duration: number;
  completed?: boolean;
}

export const watchHistoryApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getWatchHistoryByMovie: build.query<WatchHistory, GetWatchHistoryParams>({
      query: ({ movieId, mediaType }) => `/watch-history/${movieId}/${mediaType}`,
      providesTags: (_res, _err, args) => [
        { type: "WatchHistory", id: `${args.mediaType}-${args.movieId}` },
      ],
    }),
    saveWatchHistory: build.mutation<WatchHistory, SaveWatchHistoryPayload>({
      query: (body) => ({
        url: "/watch-history",
        method: "POST",
        body,
      }),
      invalidatesTags: (res) =>
        res
          ? [{ type: "WatchHistory", id: `${res.mediaType}-${res.movieId}` }]
          : [],
    }),
    markComplete: build.mutation<WatchHistory, GetWatchHistoryParams>({
      query: ({ movieId, mediaType }) => ({
        url: `/watch-history/${movieId}/${mediaType}/complete`,
        method: "PUT",
      }),
      invalidatesTags: (_res, _err, args) => [
        { type: "WatchHistory", id: `${args.mediaType}-${args.movieId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWatchHistoryByMovieQuery,
  useSaveWatchHistoryMutation,
  useMarkCompleteMutation,
} = watchHistoryApi;

