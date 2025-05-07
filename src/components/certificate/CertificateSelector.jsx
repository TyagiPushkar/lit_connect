import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
} from "@mui/material";


import cert1 from "./assets/C1.png";
import cert2 from "./assets/C2.png";
import C1 from "./C1";
import C2 from "./C2";


const templates = [
  { id: 1, image: cert1, label: "Standard Certificate" },

  { id: 2, image: cert2, label: "Blue Certificate" },
];

const CertificateSelector = () => {
  const [selected, setSelected] = useState(null);

  const renderCertificate = () => {
    switch (selected) {
      case 1:
        return <C1 />;
        case 2:
            return <C2/>
      default:
        return null;
    }
  };

  if (selected) {
    return (
      <Box>
        <Typography
          sx={{ cursor: "pointer", color: "blue", mb: 2 }}
          onClick={() => setSelected(null)}
        >
          ← Back to Templates
        </Typography>
        {renderCertificate()}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" gutterBottom>
        Select Certificate Design
      </Typography>
      <Grid container spacing={3}>
        {templates.map((tpl) => (
          <Grid item xs={12} sm={6} md={3} key={tpl.id}>
            <Card>
              <CardActionArea onClick={() => setSelected(tpl.id)}>
                <CardMedia
                  component="img"
                  height="180"
                  image={tpl.image}
                  alt={`Certificate ${tpl.id}`}
                />
                <Box sx={{ textAlign: "center", p: 1 }}>
                  <Typography variant="subtitle1">{tpl.label}</Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
          </Grid>
    </Box>
  );
};

export default CertificateSelector;
