import { Outlet, useLocation, useNavigation, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";

import DetailModal from "src/components/DetailModal";
import VideoPortalContainer from "src/components/VideoPortalContainer";
import DetailModalProvider from "src/providers/DetailModalProvider";
import PortalProvider from "src/providers/PortalProvider";
import { MAIN_PATH } from "src/constant";
import { Footer, MainHeader } from "src/components/layouts";
import MainLoadingScreen from "src/components/MainLoadingScreen";

export default function MainLayout() {
  const location = useLocation();
  const navigation = useNavigation();
  const isWatchPage = location.pathname.startsWith(`/${MAIN_PATH.watch}`);
  // console.log("Nav Stat: ", navigation.state);
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {!isWatchPage && <MainHeader />}
      {navigation.state !== "idle" && <MainLoadingScreen />}
      <DetailModalProvider>
        <DetailModal />
        <PortalProvider>
          {/* <MainLoadingScreen /> */}
          <Outlet />
          <VideoPortalContainer />
        </PortalProvider>
      </DetailModalProvider>
      {!isWatchPage && <Footer />}
    </Box>
  );
}
