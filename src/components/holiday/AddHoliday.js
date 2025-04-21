import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

function AddHoliday({ open, onClose, onHolidayAdded }) {
    const { user } = useAuth(); // Access `user` from `useAuth`
    const [holidays, setHolidays] = useState([{ date: '', title: '' }]);

    const handleHolidayChange = (index, field, value) => {
        const newHolidays = [...holidays];
        newHolidays[index][field] = value;
        setHolidays(newHolidays);
    };

    const handleAddHoliday = () => {
        setHolidays([...holidays, { date: '', title: '' }]);
    };

    const handleRemoveHoliday = (index) => {
        setHolidays(holidays.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                Tenent_Id: user.tenent_id, // Include Tenent_Id from the user object
                holidays,
            };

            const response = await axios.post('https://namami-infotech.com/LIT/src/holiday/add_holiday.php', payload);

            if (response.data.success) {
                onHolidayAdded();
                onClose();
            } else {
                console.error('Failed to add holidays:', response.data.message);
            }
        } catch (err) {
            console.error('Error adding holidays:', err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle style={{ backgroundColor: "#CC7A00", color: "white" }}>Add Holidays</DialogTitle>
            <br />
            <DialogContent>
                {holidays.map((holiday, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <TextField
                            label="Date"
                            type="date"
                            value={holiday.date}
                            onChange={(e) => handleHolidayChange(index, 'date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                            style={{ marginRight: '1rem' }}
                        />
                        <TextField
                            label="Title"
                            value={holiday.title}
                            onChange={(e) => handleHolidayChange(index, 'title', e.target.value)}
                            variant="outlined"
                        />
                        {holidays.length > 1 && (
                            <IconButton onClick={() => handleRemoveHoliday(index)} color="secondary">
                                <RemoveIcon />
                            </IconButton>
                        )}
                    </div>
                ))}
                <Button startIcon={<AddIcon />} onClick={handleAddHoliday}>
                    Add Another Holiday
                </Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddHoliday;
