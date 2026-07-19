import {
  Box,
  Container,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  Button,
  TextField,
  styled,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  IconButton,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { BASE_URL } from "../config/axiosConfig";
import axios from "axios";
import ResponsiveAppBar from "../components/Navbar";
import { Delete, Edit, PlusOne } from "@mui/icons-material";

const StyledContainer = styled(Container)({
  textAlign: "center",
  background: "#fff",
  margin: "50px auto",
  padding: "20px",
  width: "500px",
});

const StyledForm = styled("form")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "15px",
});

const StyledInput = styled(TextField)({
  marginBottom: "10px",
});

const StyledButton = styled(Button)({
  marginTop: "20px",
});

const Dashboard = () => {
  const [dresses, setDresses] = useState([]);
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    advance: "",
    category: "",
    image: "",
    description: "",
    tags: "",
    occasion: "",
    color: "",
    pattern: "",
    style: "",
    season: "",
  });

  const handleClose = () => setOpen((prev) => !prev);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddDress = () => {
    console.log(formData);
    axios
      .post(`${BASE_URL}/products/create`, formData)
      .then((res) => {
        console.log("object", res);
        setDresses(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
    // setDresses([...dresses, formData]);
    setFormData({
      name: "",
      price: "",
      stock: "",
      advance: "",
      category: "",
      image: "",
      description: "",
      tags: "",
      occasion: "",
      color: "",
      pattern: "",
      style: "",
      season: "",
    });
  };

  const handleGenerateAI = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      alert("Please enter Dress Name, Category, and Price first.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await axios.post("http://localhost:8001/ai/generate-description", {
        productName: formData.name,
        category: formData.category,
        price: Number(formData.price)
      });
      const aiData = res.data;
      setFormData(prev => ({
        ...prev,
        name: aiData.title || prev.name,
        description: aiData.description || prev.description,
        tags: aiData.tags ? aiData.tags.join(", ") : prev.tags,
        occasion: aiData.occasion || prev.occasion,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to generate description with AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoTagAI = async () => {
    if (!formData.name || !formData.category) {
      alert("Please enter Dress Name and Category first.");
      return;
    }
    setIsTagging(true);
    try {
      const res = await axios.post("http://localhost:8001/ai/generate-tags", {
        productName: formData.name,
        category: formData.category
      });
      const aiData = res.data;
      setFormData(prev => ({
        ...prev,
        color: aiData.color || prev.color,
        pattern: aiData.pattern || prev.pattern,
        style: aiData.style || prev.style,
        season: aiData.season || prev.season,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to auto-tag with AI.");
    } finally {
      setIsTagging(false);
    }
  };
  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      category: event.target.value,
    }));
  };

  useEffect(() => {
    axios
      .get(`${BASE_URL}/products`)
      .then((res) => {
        console.log("object", res);
        setDresses(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleDelete = async (_id) => {
    await axios
      .post(`${BASE_URL}/products/delete`, { _id })
      .then((res) => {
        console.log("object", res);
        setDresses(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      <ResponsiveAppBar />
      <Container sx={{ padding: "20px" }}>
        <Table sx={{ marginTop: "20px" }}>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Dress name</TableCell>
              <TableCell>Dress Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Advance</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  startIcon={<PlusOne />}
                  onClick={handleClose}
                >
                  Add Dress
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(dresses) &&
              dresses?.map((dress, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <img
                      style={{ width: 100, height: 100, objectFit: "contain" }}
                      src={dress?.image}
                    />
                  </TableCell>
                  <TableCell>{dress?.name}</TableCell>
                  <TableCell>{dress?.price}</TableCell>
                  <TableCell>{dress?.stock}</TableCell>
                  <TableCell>{dress?.advance}</TableCell>
                  <TableCell>{dress?.category}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      {/* <IconButton>
                      <Edit />
                    </IconButton> */}
                      <IconButton onClick={() => handleDelete(dress._id)}>
                        <Delete
                          sx={{
                            color: "#cc0000",
                          }}
                        />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <Box mt={5}>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <StyledContainer>
              <Typography variant="h6">Add Dress</Typography>
              <StyledForm onSubmit={handleAddDress}>
                <StyledInput
                  type="text"
                  id="image"
                  name="image"
                  fullWidth
                  label="Image URL"
                  value={formData.image}
                  required
                  variant="outlined"
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="name"
                  name="name"
                  fullWidth
                  label="Dress Name"
                  value={formData.name}
                  required
                  variant="outlined"
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="price"
                  name="price"
                  fullWidth
                  required
                  variant="outlined"
                  label="Price"
                  value={formData.price}
                  onChange={handleInputChange}
                />
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Category
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={formData.category}
                    label="Age"
                    onChange={handleChange}
                  >
                    <MenuItem value={"men"}>Men's</MenuItem>
                    <MenuItem value={"women"}>Women's</MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || isTagging}
                    fullWidth
                  >
                    {isGenerating ? "Generating..." : "Generate with AI ✨"}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="info" 
                    onClick={handleAutoTagAI}
                    disabled={isGenerating || isTagging}
                    fullWidth
                  >
                    {isTagging ? "Tagging..." : "Auto Tag ✨"}
                  </Button>
                </Stack>
                <StyledInput
                  type="text"
                  id="description"
                  name="description"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="tags"
                  name="tags"
                  fullWidth
                  variant="outlined"
                  label="Tags (comma separated)"
                  value={formData.tags}
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="occasion"
                  name="occasion"
                  fullWidth
                  variant="outlined"
                  label="Occasion"
                  value={formData.occasion}
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="color"
                  name="color"
                  fullWidth
                  variant="outlined"
                  label="Color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="pattern"
                  name="pattern"
                  fullWidth
                  variant="outlined"
                  label="Pattern"
                  value={formData.pattern}
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="style"
                  name="style"
                  fullWidth
                  variant="outlined"
                  label="Style"
                  value={formData.style}
                  onChange={handleInputChange}
                />
                <StyledInput
                  type="text"
                  id="season"
                  name="season"
                  fullWidth
                  variant="outlined"
                  label="Season"
                  value={formData.season}
                  onChange={handleInputChange}
                />
                <StyledInput
                  fullWidth
                  type="text"
                  id="stock"
                  name="stock"
                  required
                  variant="outlined"
                  label="Stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                />
                <StyledInput
                  fullWidth
                  type="text"
                  id="advance"
                  name="advance"
                  required
                  variant="outlined"
                  label="Advance"
                  value={formData.advance}
                  onChange={handleInputChange}
                />
                <StyledButton fullWidth type="submit" variant="contained">
                  Add Dress
                </StyledButton>
              </StyledForm>
            </StyledContainer>
          </Modal>
        </Box>
      </Container>
    </>
  );
};

export default Dashboard;
