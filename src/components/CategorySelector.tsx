import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid
} from '@mui/material';

interface CategorySelectorProps {
  onCategorySelected: (category: 'trees' | 'other') => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onCategorySelected }) => {
  const categories = [
    {
      id: 'trees',
      name: 'Trees',
      icon: '🌳',
      description: 'Tree and ornamental applications',
      color: '#2e7d32' // Green
    },
    {
      id: 'other',
      name: 'Other',
      icon: '🚜',
      description: 'General purpose applications',
      color: '#ed6c02' // Orange
    }
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Specialty Applications
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Select application category
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {categories.map((category) => (
            <Grid item xs={12} sm={6} key={category.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: 2,
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-4px)',
                    borderColor: category.color
                  },
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => onCategorySelected(category.id as 'trees' | 'other')}
              >
                {/* Colored header bar */}
                <Box sx={{ 
                  height: 8, 
                  backgroundColor: category.color,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }} />
                
                <CardContent sx={{ textAlign: 'center', pb: 1, pt: 4 }}>
                  <Typography sx={{ 
                    fontSize: 80, 
                    mb: 2, 
                    filter: `drop-shadow(0 2px 4px ${category.color}40)` 
                  }}>
                    {category.icon}
                  </Typography>
                  
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    gutterBottom 
                    sx={{ fontWeight: 'bold', color: category.color }}
                  >
                    {category.name}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    {category.description}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    variant="contained"
                    size="large"
                    sx={{ 
                      backgroundColor: category.color,
                      '&:hover': {
                        backgroundColor: category.color,
                        opacity: 0.9
                      },
                      minWidth: 140,
                      py: 1.5
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategorySelected(category.id as 'trees' | 'other');
                    }}
                  >
                    Select
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default CategorySelector;
