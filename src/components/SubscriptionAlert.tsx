import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

interface SubscriptionAlertProps {
  open: boolean;
  onClose: () => void;
}

export default function SubscriptionAlert({ open, onClose }: SubscriptionAlertProps) {
  const navigate = useNavigate();

  const handleGoToAccount = () => {
    navigate(`/${MAIN_PATH.account}`);
    onClose();
  };

  const handleGoToPayment = () => {
    navigate(`/${MAIN_PATH.payment}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Tài khoản chưa được kích hoạt
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tài khoản của bạn đang chờ được admin duyệt. Vui lòng đợi admin chấp nhận để có thể xem phim.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Bạn có thể kiểm tra trạng thái tài khoản trong trang Account hoặc chọn gói subscription trong trang Payment.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
        <Button onClick={handleGoToAccount} variant="outlined">
          Xem Tài khoản
        </Button>
        <Button onClick={handleGoToPayment} variant="contained" sx={{ bgcolor: "#e50914" }}>
          Chọn Gói
        </Button>
      </DialogActions>
    </Dialog>
  );
}

