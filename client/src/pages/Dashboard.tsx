import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';

import { RootState, AppDispatch } from '../store';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  // This would be actual data from Redux store in the real implementation
  const dashboardData = {
    recentProjects: [
      { id: '1', name: 'Summer EP', tracks: 5, status: 'active' },
      { id: '2', name: 'Acoustic Covers', tracks: 3, status: 'active' },
      { id: '3', name: 'Band Demo', tracks: 2, status: 'completed' },
    ],
    pendingFeedback: [
      { id: '1', trackName: 'Summer Vibes', projectName: 'Summer EP', count: 3 },
      { id: '2', trackName: 'Ocean Breeze', projectName: 'Summer EP', count: 2 },
      { id: '3', trackName: 'Acoustic Guitar Solo', projectName: 'Acoustic Covers', count: 1 },
    ],
    recentActivity: [
      { id: '1', type: 'comment', user: 'Jane Smith', trackName: 'Summer Vibes', time: '2 hours ago' },
      { id: '2', type: 'version', user: 'You', trackName: 'Ocean Breeze', time: '1 day ago' },
      { id: '3', type: 'invitation', user: 'John Doe', projectName: 'New Collaboration', time: '3 days ago' },
    ],
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName || user?.username}!
        </Typography>
        <Typography color="text.secondary">
          Here's an overview of your music projects and recent activity.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Projects
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {dashboardData.recentProjects.length > 0 ? (
                <Stack spacing={2}>
                  {dashboardData.recentProjects.map((project) => (
                    <Box key={project.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">{project.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.tracks} tracks
                        </Typography>
                      </Box>
                      <Chip 
                        label={project.status === 'active' ? 'Active' : 'Completed'}
                        color={project.status === 'active' ? 'primary' : 'success'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No recent projects found.</Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                component={RouterLink} 
                to="/projects" 
                size="small" 
                sx={{ ml: 1 }}
              >
                View All Projects
              </Button>
              <Button 
                component={RouterLink} 
                to="/projects/new" 
                size="small" 
                color="primary" 
                variant="contained" 
                sx={{ ml: 'auto', mr: 1 }}
              >
                New Project
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Pending Feedback */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Feedback
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {dashboardData.pendingFeedback.length > 0 ? (
                <Stack spacing={2}>
                  {dashboardData.pendingFeedback.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">{item.trackName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Project: {item.projectName}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${item.count} ${item.count === 1 ? 'comment' : 'comments'}`}
                        color="secondary"
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No pending feedback.</Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                component={RouterLink} 
                to="/feedback" 
                size="small" 
                sx={{ ml: 1 }}
              >
                View All Feedback
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {dashboardData.recentActivity.length > 0 ? (
                <Stack spacing={2}>
                  {dashboardData.recentActivity.map((activity) => (
                    <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {activity.type === 'comment' && `${activity.user} commented on "${activity.trackName}"`}
                          {activity.type === 'version' && `${activity.user} uploaded a new version of "${activity.trackName}"`}
                          {activity.type === 'invitation' && `${activity.user} invited you to collaborate on "${activity.projectName}"`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                      <Chip 
                        label={activity.type === 'comment' ? 'Comment' : activity.type === 'version' ? 'Version' : 'Invitation'}
                        color={activity.type === 'comment' ? 'primary' : activity.type === 'version' ? 'secondary' : 'info'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No recent activity.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
