import Box, { BoxProps } from "@mui/material/Box";
import { Link as RouterLink } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

interface LogoProps extends BoxProps {
  to?: string;
}

export default function Logo({ sx, to }: LogoProps) {
  const defaultTo = `/${MAIN_PATH.browse}`;
  return (
    <RouterLink to={to || defaultTo}>
      <Box
        component="img"
        alt="Netflix Logo"
        src="/assets/netflix-logo.png"
        width={87}
        height={25}
        sx={{
          ...sx,
        }}
      />
    </RouterLink>
  );
}
