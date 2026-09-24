import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import { Button, ButtonGroup } from '@mui/material';

export default function DownloadButtons({ onExcel, onPdf, compact = false }) {
  return (
    <ButtonGroup size="small" variant="outlined" data-no-print="true">
      <Button color="success" onClick={onExcel} startIcon={!compact && <TableViewOutlinedIcon />}>XLS{compact ? '' : 'X'}</Button>
      <Button color="error" onClick={onPdf} startIcon={!compact && <PictureAsPdfOutlinedIcon />}>PDF</Button>
    </ButtonGroup>
  );
}
