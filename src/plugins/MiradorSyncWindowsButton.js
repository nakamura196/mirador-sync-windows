import React, { useState } from 'react';

import MiradorMenuButton from 'mirador/dist/es/src/containers/MiradorMenuButton';

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

const MiradorSyncWindowsButton = ({
    updateConfig,
    groups
}) => {

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [name, setName] = useState("");

    const handleClose = () => {
        setIsDialogOpen(false);
    }

    const handleClickOpen = () => {
        setIsDialogOpen(true);
    };

    const handleChange = (event) => {
        setName(event.target.value);
    }

    const addWindowGroupName = () => {
        updateConfig({
            state: {
                groups: [
                    ...groups,
                    {
                        name,
                        settings: {
                            zoom: true,
                            rotation: true,
                            isBasicMode: true,
                        }
                    }
                ]
            }
        })
        setName("");
    }

    const deleteGroup = (index) => {
        return () => {
            const groups_ = [...groups];
            groups_.splice(index, 1);
            updateConfig({
                state: {
                    groups: groups_
                }
            })
        }
    }


    const updateRotation = (index) => {
        return (event) => {
            const groups_ = [...groups];
            groups_[index].settings.rotation = event.target.checked;
            updateConfig({
                state: {
                    groups: groups_
                }
            })
        }
    }


    const updateZoom = (index) => {
        return (event) => {
            const groups_ = [...groups];
            groups_[index].settings.zoom = event.target.checked;
            updateConfig({
                state: {
                    groups: groups_
                }
            })
        }
    }

    const updateIsBasicMode = (index) => {
        return (event) => {
            const groups_ = [...groups];
            groups_[index].settings.isBasicMode = !event.target.checked;
            updateConfig({
                state: {
                    groups: groups_
                }
            })
        }
    }

    return (
        <>
            <MiradorMenuButton
                aria-label="Synchronized Windows"
                onClick={handleClickOpen}
            >
                <AccountTree />
            </MiradorMenuButton>

            <Dialog
                open={isDialogOpen}
                onClose={handleClose}
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
                        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, border: '1px solid #000' }}
                    >
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            value={name}
                            onChange={handleChange}
                        />
                        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                        <IconButton color="primary" sx={{ p: '10px' }} onClick={addWindowGroupName}>
                            <AddIcon />
                        </IconButton>
                    </Paper>

                    <div>
                        {groups.map((windowGroup, index) => {
                            return (
                                <Accordion variant='outlined' style={{ marginTop: 8, border: '1px solid #000' }}>
                                    <AccordionSummary
                                        key={index}
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="panel1-content"
                                        id="panel1-header"
                                    >
                                        {windowGroup.name}
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <FormGroup>
                                            <FormControlLabel control={
                                                <Checkbox checked={windowGroup.settings.zoom} onChange={
                                                    updateZoom(index)
                                                } />
                                            } label="zoom/pan" />

                                            <FormControlLabel control={
                                                <Checkbox checked={windowGroup.settings.rotation}
                                                    onChange={
                                                        updateRotation(index)
                                                    }
                                                />
                                            } label="rotation" />

                                            <FormControlLabel control={
                                                <Checkbox checked={
                                                    !windowGroup.settings.isBasicMode}
                                                    onChange={
                                                        updateIsBasicMode(index)
                                                    }
                                                />
                                            } label="advanced" />
                                        </FormGroup>
                                    </AccordionDetails>
                                    <AccordionActions>
                                        <IconButton color="error" sx={{ p: '10px' }} onClick={deleteGroup(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </AccordionActions>
                                </Accordion>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
};

export default MiradorSyncWindowsButton;
