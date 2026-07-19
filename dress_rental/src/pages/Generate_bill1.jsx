import React from "react";
import {
  Container,
  Typography,
  Button,
  Radio,
  RadioGroup,k
  FormControlLabel,
} from "@mui/material";

const InvoicePage = ({ formData }) => {
  const { dress_name, dress_price, rent_days, advance } = formData;

  // Calculate total price
  const total_price =
    parseInt(advance) + parseInt(dress_price) * parseInt(rent_days);

  return (
    <Container
      maxWidth="md"
      sx={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Typography variant="h2" sx={{ color: "#333" }}>
        Invoice
      </Typography>
      <Typography variant="body1">
        <strong>Dress Name:</strong> {dress_name}
      </Typography>
      <Typography variant="body1">
        <strong>Rental Price per Day:</strong> Rs. {dress_price}
      </Typography>
      <Typography variant="body1">
        <strong>Number of Days Rented:</strong> {rent_days}
      </Typography>
      <Typography variant="body1">
        <strong>Total Price:</strong> Rs. {total_price}
      </Typography>
      <ul>
        <li>
          <i>Thank you for renting with us!</i>
        </li>
        <li>Please pick your dress from our store</li>
        <li>Address: Wardrobe Wonders , SIT Backgate , Tumkur, 572103</li>
        <li style={{ color: "red" }}>
          Your advance amount will be returned once you return our dress without
          any damage and on time, or else extra charges will be applied.
        </li>
      </ul>
      <Button
        variant="contained"
        color="primary"
        sx={{ marginTop: "20px" }}
        onClick={() => window.history.back()}
      >
        Back
      </Button>
      <form action="payment_successful1.php" method="post">
        <input type="hidden" name="dress_name" value={dress_name} />
        <input type="hidden" name="dress_price" value={dress_price} />
        <input type="hidden" name="days" value={rent_days} />
        <div className="payment-options">
          <Typography variant="h3">Select Payment Option:</Typography>
          <RadioGroup name="payment-option">
            <FormControlLabel
              value="Cash on Delivery"
              control={<Radio />}
              label="Cash on Delivery"
            />
            <FormControlLabel
              value="UPI"
              control={<Radio />}
              label="UPI - wardrobewonder@ybl"
            />
          </RadioGroup>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ marginTop: "20px" }}
          >
            Submit Payment
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default InvoicePage;
