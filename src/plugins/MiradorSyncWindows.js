import React, { Component } from 'react';
import PropTypes from 'prop-types';
import compose from 'lodash/flowRight';
import { withSize } from 'react-sizeme';


import { styled, alpha } from '@mui/material/styles';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import DoDisturbIcon from '@mui/icons-material/DoDisturb';

const SizeContainer = styled('div')(() => ({
  position: 'static !important',
}));

const ToggleContainer = styled('div')(() => ({
  border: 0,
  borderImageSlice: 1,
}));

const ToolContainer = styled('div')(() => ({
  display: 'flex',
  border: 0,
  borderImageSlice: 1,
}));

/** Styles for withStyles HOC */
const Root = styled('div')(({ small, theme: { palette } }) => {
  const backgroundColor = palette.shades.main;
  const foregroundColor = palette.getContrastText(backgroundColor);
  const border = `1px solid ${alpha(foregroundColor, 0.2)}`;
  const borderImageRight = 'linear-gradient('
    + 'to bottom, '
    + `${alpha(foregroundColor, 0)} 20%, `
    + `${alpha(foregroundColor, 0.2)} 20% 80%, `
    + `${alpha(foregroundColor, 0)} 80% )`;
  const borderImageBottom = borderImageRight.replace('to bottom', 'to right');
  return {
    backgroundColor: alpha(backgroundColor, 0.8),
    /* borderRadius: 25, */
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 999,
    display: 'flex',
    flexDirection: 'row',
    ...(small && { flexDirection: 'column' }),
    [ToggleContainer]: {
      ...(small && {
        borderBottom: border,
        borderImageSource: borderImageBottom,
        display: 'flex',
      }),
    },
    [ToolContainer]: {
      ...(!small && {
        borderRight: border,
        borderImageSource: borderImageRight,
        flexDirection: 'row',
      }),
      ...(small && {
        flexDirection: 'column',
        borderBottom: border,
        borderImageSource: borderImageBottom,
      }),
    },
  };
});

class MiradorSyncWindows extends Component {
  constructor(props) {
    super(props);
  }

  handleChange(param) {
    const { updateViewport, windowId } = this.props;
    return (value) => updateViewport(windowId, { [param]: value });
  }

  selectGroup(name) {
    const { updateWindow, windowId } = this.props;
    updateWindow(windowId, { groupName: name });
  }


  render() {
    const {
      enabled, viewer,
      viewConfig: {
      },
      groups,
      groupName,
    } = this.props;

    if (!viewer || !enabled) return null;

    return (
      <React.Fragment>
        <SizeContainer>
          <Root className="MuiPaper-elevation4">
            {true
              && (
                <React.Fragment>
                  <List>
                    <ListItem disablePadding onClick={
                      () => this.selectGroup('')
                    }>
                      <ListItemButton>
                        <ListItemIcon>
                          <DoDisturbIcon />
                        </ListItemIcon>
                        <ListItemText primary="no group" />
                      </ListItemButton>
                    </ListItem>

                    {groups.map((group) => {
                      const isSelected = group.name === groupName;
                      return (
                        <ListItem disablePadding>
                          <ListItemButton onClick={
                            () => this.selectGroup(group.name)
                          } selected={
                            isSelected
                          }>
                            {group.name}
                          </ListItemButton>
                        </ListItem>
                      )
                    })}
                  </List>
                </React.Fragment>
              )}
          </Root>
        </SizeContainer>
      </React.Fragment>
    );
  }
}

MiradorSyncWindows.propTypes = {
  enabled: PropTypes.bool,
  size: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  t: PropTypes.func.isRequired,
  updateViewport: PropTypes.func.isRequired,
  updateWindow: PropTypes.func.isRequired,
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  viewConfig: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
  groups: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};

MiradorSyncWindows.defaultProps = {
  enabled: true,
  size: {},
  viewer: undefined,
  viewConfig: {},
  groups: [],
};

// Export without wrapping HOC for testing.
export const TestablesyncWindows = MiradorSyncWindows;

export default compose(withSize())(MiradorSyncWindows);
