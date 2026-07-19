import { Box, Typography, Container, Grid } from "@mui/material";
import { styled } from "@mui/system";
import LocalPlayOutlinedIcon from '@mui/icons-material/LocalPlayOutlined'; // Using as a proxy for the crown
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';

const StripContainer = styled(Box)({
  backgroundColor: "#FFFFFF",
  padding: "40px 0",
  borderBottom: "1px solid #EEEEEE",
});

const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '0 24px',
  position: 'relative',
  "&:not(:last-child)::after": {
    content: '""',
    position: 'absolute',
    right: 0,
    top: '10%',
    height: '80%',
    width: '1px',
    backgroundColor: '#EEEEEE',
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  [theme.breakpoints.down('md')]: {
    padding: '16px 0',
    justifyContent: 'center',
  }
}));

const IconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#444',
  '& svg': {
    fontSize: '2rem',
  }
});

const FeaturesStrip = () => {
  const features = [
    {
      icon: <LocalPlayOutlinedIcon />,
      title: "Premium Collection",
      subtitle: "Handpicked designer outfits"
    },
    {
      icon: <SecurityOutlinedIcon />,
      title: "Easy & Secure",
      subtitle: "Safe payments & easy returns"
    },
    {
      icon: <EventAvailableOutlinedIcon />,
      title: "Flexible Rentals",
      subtitle: "Rent for any occasion"
    },
    {
      icon: <FaceRetouchingNaturalIcon />,
      title: "AI Stylist",
      subtitle: "Get outfit suggestions"
    }
  ];

  return (
    <StripContainer>
      <Container maxWidth="xl">
        <Grid container>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureItem>
                <IconWrapper>
                  {feature.icon}
                </IconWrapper>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#222' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#777', mt: 0.5 }}>
                    {feature.subtitle}
                  </Typography>
                </Box>
              </FeatureItem>
            </Grid>
          ))}
        </Grid>
      </Container>
    </StripContainer>
  );
};

export default FeaturesStrip;
