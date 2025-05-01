// AdmissionFormRenderer.js
import React from "react";
import {
  Box,
  Grid,
  Typography,
  Divider,
  Button,
  TextField,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormGroup,
  Checkbox,
} from "@mui/material";

function AdmissionFormRenderer({
  pages,
  checkpoints,
  types,
  currentPage,
  setCurrentPage,
  formData,
  errors,
  handleChange,
  handleNext,
}) {
  const getType = (typeId) => {
    const type = types.find((t) => t.TypeId === typeId);
    return type ? type.Type.trim() : "Unknown";
  };

  const renderField = (cp) => {
    const type = getType(cp.TypeId).trim();
    const options = cp.Options ? cp.Options.split(",") : [];
    const value = formData[cp.CheckpointId] || "";
    const error = errors[cp.CheckpointId];
    const editable = cp.Editable === 1;

    if (type.toLowerCase().includes("header")) {
      return (
        <Typography variant="h6" sx={{ mt: 3, mb: 1, textAlign: "center" }}>
          {cp.Description}
        </Typography>
      );
    }

    if (type.toLowerCase().includes("description")) {
      return <Typography sx={{ mb: 2 }}>{cp.Description}</Typography>;
    }

    return (
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={4}>
          <Typography>{cp.Description}</Typography>
        </Grid>
        <Grid item xs={8}>
          {(() => {
            switch (type) {
              case "Text":
              case "Email":
              case "Number":
              case "Digit":
                return (
                  <TextField
                    fullWidth
                    type={type === "Email" ? "email" : "text"}
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                  />
                );
              case "Long Text":
                return (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                  />
                );
              case "Date":
                return (
                  <TextField
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                  />
                );
              case "Dropdown":
                return (
                  <TextField
                    fullWidth
                    select
                    value={value}
                    onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    error={error}
                    helperText={error ? "This field is required" : ""}
                    disabled={!editable}
                  >
                    {options.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              case "Radio":
                return (
                  <>
                    <RadioGroup
                      row
                      value={value}
                      onChange={(e) => handleChange(cp.CheckpointId, e.target.value)}
                    >
                      {options.map((opt) => (
                        <FormControlLabel
                          key={opt}
                          value={opt}
                          control={<Radio disabled={!editable} />}
                          label={opt}
                        />
                      ))}
                    </RadioGroup>
                    {error && (
                      <Typography color="error" variant="body2">
                        This field is required
                      </Typography>
                    )}
                  </>
                );
              case "Checkbox":
                return (
                  <FormGroup row>
                    {options.map((opt) => (
                      <FormControlLabel
                        key={opt}
                        control={
                          <Checkbox
                            checked={value?.includes(opt)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updated = checked
                                ? [...(value || []), opt]
                                : (value || []).filter((v) => v !== opt);
                              handleChange(cp.CheckpointId, updated);
                            }}
                            disabled={!editable}
                          />
                        }
                        label={opt}
                      />
                    ))}
                  </FormGroup>
                );
              case "Pic/Camera":
                return (
                  <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: "image/png, image/jpeg" }}
                    onChange={(e) =>
                      handleChange(cp.CheckpointId, e.target.files[0])
                    }
                    disabled={!editable}
                  />
                );
              default:
                return <TextField fullWidth disabled />;
            }
          })()}
        </Grid>
      </Grid>
    );
  };

  const pageData = pages[currentPage];

  return (
    <Box sx={{ mt: 1, p: 1 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Page {currentPage + 1} of {pages.length}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {pageData?.map((id) => {
        const cp = checkpoints.find((c) => c.CheckpointId === id);
        return cp ? (
          <Box key={id} sx={{ mb: 2 }}>
            {renderField(cp)}
          </Box>
        ) : null;
      })}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          variant="contained"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          disabled={currentPage === pages.length - 1}
          onClick={handleNext}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

export default AdmissionFormRenderer;
