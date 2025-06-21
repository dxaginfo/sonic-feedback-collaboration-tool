import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  TextField,
  Button,
  Collapse,
  Divider,
  Stack,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Check as CheckIcon,
  AccessTime as TimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface FeedbackReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

interface FeedbackItemProps {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: number;
  category: 'mixing' | 'composition' | 'performance' | 'general';
  content: string;
  isResolved: boolean;
  createdAt: string;
  replies: FeedbackReply[];
  onReply: (feedbackId: string, content: string) => void;
  onResolve: (feedbackId: string) => void;
  currentUserId: string;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
  id,
  authorId,
  authorName,
  authorAvatar,
  timestamp,
  category,
  content,
  isResolved,
  createdAt,
  replies,
  onReply,
  onResolve,
  currentUserId,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(replies.length > 0);

  // Format timestamp for display (mm:ss)
  const formatTimestamp = (time: number): string => {
    if (!time) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get color for category chip
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'mixing':
        return 'primary';
      case 'composition':
        return 'secondary';
      case 'performance':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(id, replyContent);
      setReplyContent('');
      setIsReplying(false);
      setShowReplies(true);
    }
  };

  return (
    <Box sx={{ mb: 3, opacity: isResolved ? 0.7 : 1 }}>
      <Box sx={{ display: 'flex', mb: 1, alignItems: 'flex-start' }}>
        <Avatar src={authorAvatar} alt={authorName} sx={{ mr: 2 }} />
        
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
              {authorName}
            </Typography>
            
            <Chip 
              size="small" 
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              color={getCategoryColor(category) as any}
              sx={{ mr: 1 }}
            />
            
            <Chip
              size="small"
              icon={<TimeIcon />}
              label={formatTimestamp(timestamp)}
              variant="outlined"
            />
            
            {isResolved && (
              <Chip 
                size="small" 
                icon={<CheckIcon />}
                label="Resolved" 
                color="success"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          
          <Typography variant="body1" sx={{ mb: 1 }}>
            {content}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            {createdAt}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', ml: 7, mb: 1 }}>
        {!isResolved && (
          <Button 
            size="small" 
            startIcon={<ReplyIcon />}
            onClick={() => setIsReplying(!isReplying)}
            sx={{ mr: 1 }}
          >
            Reply
          </Button>
        )}
        
        {currentUserId === authorId && !isResolved && (
          <Button 
            size="small" 
            startIcon={<CheckIcon />}
            onClick={() => onResolve(id)}
            color="success"
          >
            Mark as Resolved
          </Button>
        )}
        
        {replies.length > 0 && (
          <Button
            size="small"
            endIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowReplies(!showReplies)}
            sx={{ ml: 'auto' }}
          >
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </Button>
        )}
      </Box>
      
      {/* Reply Form */}
      <Collapse in={isReplying} timeout="auto">
        <Box sx={{ ml: 7, mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              size="small" 
              onClick={() => setIsReplying(false)}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              size="small" 
              variant="contained" 
              onClick={handleReplySubmit}
              disabled={!replyContent.trim()}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Collapse>
      
      {/* Replies */}
      <Collapse in={showReplies} timeout="auto">
        <Stack spacing={2} sx={{ ml: 7, mt: 1 }}>
          {replies.map((reply) => (
            <Box key={reply.id} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Avatar 
                src={reply.authorAvatar} 
                alt={reply.authorName} 
                sx={{ width: 32, height: 32, mr: 1.5 }} 
              />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
                    {reply.authorName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reply.createdAt}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {reply.content}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Collapse>
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default FeedbackItem;
