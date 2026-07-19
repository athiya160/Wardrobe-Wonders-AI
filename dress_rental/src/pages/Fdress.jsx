import { Box, Typography } from "@mui/material";
import axios from "axios";
import { styled } from "@mui/system";
import ResponsiveAppBar from "../components/Navbar";
import { useEffect, useState } from "react";
import { BASE_URL } from "../config/axiosConfig";
import ProductCard from "../components/ProductCard";

const StyledContainer = styled(Box)({
  width: "100%",
  margin: "auto",
  display: "flex",
  flexWrap: "wrap",
});

const Fdress = () => {
  const [dress, setDresses] = useState([]);
  useEffect(() => {
    axios
      .get(`${BASE_URL}/products/gender/women`)
      .then((res) => {
        console.log("object", res);
        setDresses(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  return (
    <div>
      <ResponsiveAppBar />
      <Typography mt={3} mx={2} variant="h5">
        Woman Collections
      </Typography>
      <StyledContainer>
        {Array.isArray(dress) &&
          dress.map((dress, index) => (
            <ProductCard key={index} dress={dress} />
          ))}
      </StyledContainer>
    </div>
  );
};

export default Fdress;
