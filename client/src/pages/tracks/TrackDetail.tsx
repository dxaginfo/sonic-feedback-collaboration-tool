import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

import WaveformPlayer from '../../components/tracks/WaveformPlayer';
import FeedbackItem from '../../components/feedback/FeedbackItem';

const TrackDetail: React.FC = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newFeedback, setNewFeedback] = useState('');
  const [newFeedbackCategory, setNewFeedbackCategory] = useState('general');
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  // Mock data - in a real app, this would come from Redux or an API call
  const trackData = {
    id: trackId,
    title: 'Summer Vibes',
    projectId: '1',
    projectName: 'Summer EP',
    uploaderId: 'user1',
    uploaderName: 'John Doe',
    description: 'A chill summer track with guitar and synths.',
    fileUrl: 'https://example.com/audio/summer-vibes.mp3',
    fileFormat: 'MP3',
    durationSeconds: 180, // 3 minutes
    bpm: 120,
    key: 'C Major',
    versionNumber: 2,
    isLatest: true,
    createdAt: '2023-06-15T14:30:00Z',
  };

  const feedbackData = [
    {
      id: 'f1',
      authorId: 'user2',
      authorName: 'Jane Smith',
      authorAvatar: 'https://mui.com/static/images/avatar/2.jpg',
      timestamp: 45.5, // 45.5 seconds into the track
      category: 'mixing',
      content: 'The bass is too prominent here. Consider reducing it by 2-3dB.',
      isResolved: false,
      createdAt: '2 days ago',
      replies: [
        {
          id: 'r1',
          authorId: 'user1',
          authorName: 'John Doe',
          authorAvatar: 'https://mui.com/static/images/avatar/1.jpg',
          content: 'Thanks for the feedback. I'll adjust it in the next version.',
          createdAt: '1 day ago',
        },
      ],
    },
    {
      id: 'f2',
      authorId: 'user3',
      authorName: 'Mike Johnson',
      authorAvatar: 'https://mui.com/static/images/avatar/3.jpg',
      timestamp: 92.0, // 1:32 into the track
      category: 'composition',
      content: 'This transition could be smoother. Maybe add a riser or some ambient sounds?',
      isResolved: true,
      createdAt: '3 days ago',
      replies: [],
    },
    {
      id: 'f3',
      authorId: 'user4',
      authorName: 'Sarah Williams',
      authorAvatar: 'https://mui.com/static/images/avatar/4.jpg',
      timestamp: 120.0, // 2:00 into the track
      category: 'performance',
      content: 'The guitar solo here is fantastic! Really captures the summer vibe.',
      isResolved: false,
      createdAt: '1 day ago',
      replies: [],
    },
  ];

  // Simulating API call
  useEffect(() => {
    const loadData = async () => {
      // In a real app, you would fetch data here
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    loadData();
  }, [trackId]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleFeedbackSubmit = () => {
    if (newFeedback.trim() && selectedTimestamp !== null) {
      // In a real app, you would dispatch an action to add the feedback
      console.log('Submitting feedback:', {
        content: newFeedback,
        category: newFeedbackCategory,
        timestamp: selectedTimestamp || currentTime,
      });
      
      // Reset form
      setNewFeedback('');
      setNewFeedbackCategory('general');
      setSelectedTimestamp(null);
    }
  };

  const handleReply = (feedbackId: string, content: string) => {
    // In a real app, you would dispatch an action to add the reply
    console.log('Replying to feedback:', feedbackId, content);
  };

  const handleResolve = (feedbackId: string) => {
    // In a real app, you would dispatch an action to mark as resolved
    console.log('Resolving feedback:', feedbackId);
  };

  const filteredFeedback = selectedCategory === 'all'
    ? feedbackData
    : feedbackData.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {trackData.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Project: {trackData.projectName} • Version {trackData.versionNumber} • {trackData.key} • {trackData.bpm} BPM
        </Typography>
        <Typography variant="body1" paragraph>
          {trackData.description}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Waveform and Track Details */}
        <Grid item xs={12} md={7}>
          <WaveformPlayer
            audioUrl="https://wavesurfer-js.org/example/media/demo.wav" // Replace with actual URL in production
            trackName={trackData.title}
            onTimeUpdate={handleTimeUpdate}
            markers={feedbackData.map(f => ({
              id: f.id,
              time: f.timestamp,
              label: f.category,
              color: f.category === 'mixing' ? '#3f51b5' : 
                     f.category === 'composition' ? '#f50057' : 
                     f.category === 'performance' ? '#4caf50' : '#757575'
            }))}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 3, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              size="small"
            >
              Upload New Version
            </Button>
            <Button
              variant="outlined"
              startIcon={<CompareIcon />}
              size="small"
            >
              Compare Versions
            </Button>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              size="small"
            >
              Version History
            </Button>
          </Stack>

          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Track Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Uploaded by
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {trackData.uploaderName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Upload Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(trackData.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Format
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {trackData.fileFormat}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {Math.floor(trackData.durationSeconds / 60)}:{(trackData.durationSeconds % 60).toString().padStart(2, '0')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column: Feedback */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Feedback
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* New Feedback Form */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ mr: 1 }}>
                  Current Position:
                </Typography>
                <Chip 
                  label={`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`}
                  size="small"
                  color={selectedTimestamp !== null ? 'primary' : 'default'}
                  onClick={() => setSelectedTimestamp(currentTime)}
                  sx={{ mr: 1 }}
                />
                {selectedTimestamp !== null && (
                  <>
                    <Typography variant="subtitle2" sx={{ mx: 1 }}>
                      Selected:
                    </Typography>
                    <Chip 
                      label={`${Math.floor(selectedTimestamp / 60)}:${Math.floor(selectedTimestamp % 60).toString().padStart(2, '0')}`}
                      size="small"
                      color="primary"
                      onDelete={() => setSelectedTimestamp(null)}
                    />
                  </>
                )}
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add your feedback about this part of the track..."
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                  select
                  label="Category"
                  value={newFeedbackCategory}
                  onChange={(e) => setNewFeedbackCategory(e.target.value)}
                  size="small"
                  sx={{ width: '150px' }}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="mixing">Mixing</MenuItem>
                  <MenuItem value="composition">Composition</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </TextField>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleFeedbackSubmit}
                  disabled={!newFeedback.trim() || selectedTimestamp === null}
                >
                  Add Feedback
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Feedback Filter */}
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                select
                label="Filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="small"
                sx={{ width: '150px' }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="mixing">Mixing</MenuItem>
                <MenuItem value="composition">Composition</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </TextField>
            </Box>

            {/* Feedback List */}
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((feedback) => (
                <FeedbackItem
                  key={feedback.id}
                  id={feedback.id}
                  authorId={feedback.authorId}
                  authorName={feedback.authorName}
                  authorAvatar={feedback.authorAvatar}
                  timestamp={feedback.timestamp}
                  category={feedback.category as any}
                  content={feedback.content}
                  isResolved={feedback.isResolved}
                  createdAt={feedback.createdAt}
                  replies={feedback.replies}
                  onReply={handleReply}
                  onResolve={handleResolve}
                  currentUserId="user1" // This would come from auth state in a real app
                />
              ))
            ) : (
              <Typography color="text.secondary" align="center">
                No feedback found for this category.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TrackDetail;
