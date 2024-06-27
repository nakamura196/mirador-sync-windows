import React, { Component } from 'react';

//  useState,

import PropTypes from 'prop-types';

import MiradorMenuButton from '@nakamura196/mirador/dist/es/src/containers/MiradorMenuButton';

import AccountTree from '@mui/icons-material/AccountTree';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { AccordionActions } from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

class MiradorSyncWindowsButton extends Component {
  constructor(props) {
    super(props);

    // Initialize state
    this.state = {
      windowGroupName: '', // This will store the input value
      open: false,
    };
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleChange = (event) => {
    this.setState({ windowGroupName: event.target.value });
  };

  addWindowGroupName = () => {
    const { windowGroupName } = this.state;

    this.setState({ windowGroupName: '' });

    const { syncWindows, updateWorkspace } = this.props;

    const groups = syncWindows.groups || [];

    const groupsCopied = [...groups];

    groupsCopied.push({
      id: crypto.randomUUID(),
      name: windowGroupName,
      settings: {
        zoom: true,
        rotation: true,
        isBasicMode: true,
      },
    });

    updateWorkspace({

      syncWindows: {
        groups: groupsCopied,
      },
    });
  };

  updateGroup = (index, key) => (event) => {
    const { syncWindows, updateWorkspace } = this.props;
    const groups = syncWindows.groups || [];

    const groupsCopied = [...groups];
    groupsCopied[index].settings[key] = event.target.checked;

    updateWorkspace({
      syncWindows: {
        groups: groupsCopied,
      },
    });
  };

  deleteGroup = (index) => () => {
    const { syncWindows, updateWorkspace } = this.props;
    const groups = syncWindows.groups || [];

    const groupsCopied = [...groups];
    groupsCopied.splice(index, 1);

    updateWorkspace({
      syncWindows: {
        groups: groupsCopied,
      },
    });
  };

  render() {
    const { syncWindows } = this.props;
    const { open, windowGroupName } = this.state;
    const groups = syncWindows.groups || [];

    return (
      <>
        <MiradorMenuButton
          aria-label="Synchronized Windows"
          onClick={this.handleClickOpen}
        >
          <AccountTree />
        </MiradorMenuButton>

        <Dialog
          open={open}
          onClose={this.handleClose}
        >
          <DialogTitle>
            <Typography variant="h2">Manage Synchronized Windows</Typography>
          </DialogTitle>
          <DialogContent>
            <div style={{ marginBottom: 8 }}>
              Window Group Name:
            </div>
            <Paper
              component="form"
              variant="outlined"
              sx={{
                p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, border: '1px solid #000',
              }}
              onSubmit={(e) => {
                e.preventDefault(); // デフォルトのフォーム送信を防ぐ
                this.addWindowGroupName(); // addWindowGroupName メソッドを実行
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                value={windowGroupName}
                onChange={this.handleChange}
              />
              {/* {name} */}
              <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
              <IconButton color="primary" sx={{ p: '10px' }} type="submit">
                <AddIcon />
              </IconButton>
            </Paper>

            <div>
              {groups.map((windowGroup, index) => (
                <Accordion variant="outlined" style={{ marginTop: 8, border: '1px solid #000' }}>
                  <AccordionSummary
                    key={/* index */ windowGroup.id}
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    {windowGroup.name}
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={windowGroup.settings.zoom}
                            onChange={
                              // updateZoom(index)
                              this.updateGroup(index, 'zoom')
                            }
                          />
                        )}
                        label="zoom/pan"
                      />

                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={windowGroup.settings.rotation}
                            onChange={
                              // updateRotation(index)
                              this.updateGroup(index, 'rotation')
                            }
                          />
                        )}
                        label="rotation"
                      />

                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={
                              !windowGroup.settings.isBasicMode
                            }
                            onChange={
                              // updateIsBasicMode(index)
                              this.updateGroup(index, 'isBasicMode')
                            }
                          />
                        )}
                        label="advanced"
                      />
                    </FormGroup>
                  </AccordionDetails>
                  <AccordionActions>
                    <IconButton color="error" sx={{ p: '10px' }} onClick={this.deleteGroup(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </AccordionActions>
                </Accordion>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
}

MiradorSyncWindowsButton.propTypes = {
  updateWorkspace: PropTypes.func.isRequired,
  syncWindows: PropTypes.shape({
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        settings: PropTypes.shape({
          zoom: PropTypes.bool.isRequired,
          rotation: PropTypes.bool.isRequired,
          isBasicMode: PropTypes.bool.isRequired,
        }).isRequired,
      }),
    ),
  }).isRequired,
};

MiradorSyncWindowsButton.defaultProps = {};

export default MiradorSyncWindowsButton;
