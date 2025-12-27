import Stack from "@mui/material/Stack";
  import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { COMMON_TITLES, TMDB_V3_API_KEY } from "src/constant";
import HeroSection from "src/components/HeroSection";
import { genreSliceEndpoints, useGetGenresQuery } from "src/store/slices/genre";
import { MEDIA_TYPE } from "src/types/Common";
import { CustomGenre, Genre } from "src/types/Genre";
import SliderRowForGenre from "src/components/VideoSlider";
import MainLoadingScreen from "src/components/MainLoadingScreen";
import store from "src/store";

export async function loader() {
  await store.dispatch(
    genreSliceEndpoints.getGenres.initiate(MEDIA_TYPE.Movie)
  );
  return null;
}
export function Component() {
  const { data: genres, isSuccess, isLoading, isError, error } = useGetGenresQuery(MEDIA_TYPE.Movie);

  // Check if API key is configured
  if (!TMDB_V3_API_KEY) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ color: "error.main", mb: 2 }}>
          API Key chưa được cấu hình
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
          Vui lòng tạo file <code>.env</code> và thêm TMDB API Key của bạn.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Xem file <code>.env.example</code> để biết format.
        </Typography>
      </Box>
    );
  }

  // Show loading state
  if (isLoading) {
    return <MainLoadingScreen />;
  }

  // Show error state
  if (isError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ color: "error.main", mb: 2 }}>
          Không thể tải dữ liệu
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {error ? JSON.stringify(error) : "Đã xảy ra lỗi khi tải danh sách phim."}
        </Typography>
      </Box>
    );
  }

  // Show content when genres are loaded
  if (isSuccess && genres && genres.length > 0) {
    return (
      <Stack spacing={2}>
        <HeroSection mediaType={MEDIA_TYPE.Movie} />
        {[...COMMON_TITLES, ...genres].map((genre: Genre | CustomGenre) => (
          <SliderRowForGenre
            key={genre.id || genre.name}
            genre={genre}
            mediaType={MEDIA_TYPE.Movie}
          />
        ))}
      </Stack>
    );
  }

  // Fallback: show empty state if no genres
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
      }}
    >
      <Typography variant="h6" sx={{ color: "text.secondary" }}>
        Không có dữ liệu để hiển thị
      </Typography>
    </Box>
  );
}

Component.displayName = "HomePage";
