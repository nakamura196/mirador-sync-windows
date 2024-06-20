import React from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AccountTree from '@mui/icons-material/AccountTree';

const MiradorSyncWindowsMenuItem = ({
  enabled, handleClose, t, updateWindow, windowId,
}) => {
  const handleClickOpen = () => {
    handleClose();
    updateWindow(windowId, { syncWindowsEnabled: !enabled });
  };

  return (
    <MenuItem onClick={handleClickOpen}>
      <ListItemIcon>
        <AccountTree />
      </ListItemIcon>
      <ListItemText primaryTypographyProps={{ variant: 'body1' }}>
        {enabled ? t('hide') : t('show')}
      </ListItemText>
    </MenuItem>
  );
};

MiradorSyncWindowsMenuItem.propTypes = {
  enabled: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  updateWindow: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

MiradorSyncWindowsMenuItem.defaultProps = {
  enabled: true,
};

export default MiradorSyncWindowsMenuItem;
