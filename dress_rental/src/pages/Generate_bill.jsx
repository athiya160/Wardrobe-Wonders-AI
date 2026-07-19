import {
  Box,
  Container,
  Typography,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";

const Invoice = ({ dressName, dressPrice, rentDays, advance }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container sx={{ marginTop: "20px" }}>
        <Box
          sx={{
            bgcolor: "#fff",
            p: 3,
            borderRadius: "8px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h4" color="textPrimary" gutterBottom>
            Invoice
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Dress Name:</strong> {dressName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Rental Price per Day:</strong> Rs. {dressPrice}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Number of Days Rented:</strong> {rentDays}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Total Price:</strong> Rs. {advance + dressPrice * rentDays}
          </Typography>
          <ul>
            <li>
              <i>Thank you for renting with us!</i>
            </li>
            <li>Please pick your dress from our store</li>
            <li>Address: Wardrobe Wonders, SIT Backgate, Tumkur, 572103</li>
            <li style={{ color: "red" }}>
              Your advance amount will be returned once you return our dress
              without any damage and on time, or else extra charges will be
              applied.
            </li>
          </ul>
          <form onSubmit={handleSubmit}>
            <FormControl component="fieldset">
              <Typography variant="h5" gutterBottom>
                Select Payment Option:
              </Typography>
              <RadioGroup row aria-label="payment-option" name="payment-option">
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
                {/* Add more payment options as needed */}
              </RadioGroup>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Submit Payment
            </Button>
          </form>
          <Button
            variant="contained"
            color="secondary"
            sx={{ mt: 2 }}
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Invoice;
