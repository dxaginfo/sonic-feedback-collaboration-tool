import express from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index';

const router = express.Router();

// @route   GET api/feedback/track/:trackId
// @desc    Get all feedback for a track
// @access  Private
router.get('/track/:trackId', param('trackId').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get track to check access
    const track = await db('tracks').where({ id: req.params.trackId }).first();

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Check if user has access to the project this track belongs to
    const projectMember = await db('project_members')
      .where({
        project_id: track.project_id,
        user_id: req.user?.userId,
      })
      .first();

    if (!projectMember) {
      return res.status(403).json({ message: 'Access denied to this track' });
    }

    // Get all feedback for the track
    const feedback = await db('feedback')
      .where({ track_id: req.params.trackId, parent_id: null })
      .orderBy('timestamp_seconds', 'asc');

    // Get all replies for the feedback
    const feedbackIds = feedback.map(item => item.id);
    const replies = await db('feedback')
      .whereIn('parent_id', feedbackIds)
      .orderBy('created_at', 'asc');

    // Get author details for feedback and replies
    const authorIds = [
      ...new Set([
        ...feedback.map(item => item.author_id),
        ...replies.map(item => item.author_id),
      ]),
    ];

    const authors = await db('users')
      .whereIn('id', authorIds)
      .select('id', 'username', 'profile_image_url');

    // Create a map of author_id to author details
    const authorMap = authors.reduce((acc, author) => {
      acc[author.id] = author;
      return acc;
    }, {} as Record<string, any>);

    // Create a map of feedback_id to replies
    const replyMap = replies.reduce((acc, reply) => {
      if (!acc[reply.parent_id]) {
        acc[reply.parent_id] = [];
      }
      acc[reply.parent_id].push({
        ...reply,
        author: authorMap[reply.author_id],
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Add author details and replies to feedback
    const feedbackWithDetails = feedback.map(item => ({
      ...item,
      author: authorMap[item.author_id],
      replies: replyMap[item.id] || [],
    }));

    res.json(feedbackWithDetails);
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/feedback
// @desc    Add feedback to a track
// @access  Private
router.post(
  '/',
  [
    body('trackId', 'Track ID is required').isUUID(),
    body('timestampSeconds', 'Timestamp is required').isNumeric(),
    body('category', 'Category is required').isIn(['mixing', 'composition', 'performance', 'general']),
    body('content', 'Content is required').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { trackId, timestampSeconds, category, content } = req.body;

    try {
      // Get track to check access
      const track = await db('tracks').where({ id: trackId }).first();

      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }

      // Check if user has access to the project this track belongs to
      const projectMember = await db('project_members')
        .where({
          project_id: track.project_id,
          user_id: req.user?.userId,
        })
        .first();

      if (!projectMember) {
        return res.status(403).json({ message: 'Access denied to this track' });
      }

      // Create feedback
      const now = new Date();
      const [feedbackId] = await db('feedback').insert({
        id: uuidv4(),
        track_id: trackId,
        author_id: req.user?.userId,
        timestamp_seconds: timestampSeconds,
        category,
        content,
        is_resolved: false,
        parent_id: null,
        created_at: now,
        updated_at: now,
      }).returning('id');

      // Get author details
      const author = await db('users')
        .where({ id: req.user?.userId })
        .select('id', 'username', 'profile_image_url')
        .first();

      // Notify clients in the track room
      io.to(`track-${trackId}`).emit('new-feedback', {
        id: feedbackId,
        track_id: trackId,
        author,
        timestamp_seconds: timestampSeconds,
        category,
        content,
        is_resolved: false,
        created_at: now,
        replies: [],
      });

      res.status(201).json({
        id: feedbackId,
        trackId,
        timestampSeconds,
        category,
        content,
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST api/feedback/:id/reply
// @desc    Reply to feedback
// @access  Private
router.post(
  '/:id/reply',
  [
    param('id').isUUID(),
    body('content', 'Content is required').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    try {
      // Get the original feedback
      const originalFeedback = await db('feedback').where({ id: req.params.id }).first();

      if (!originalFeedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      // Get track to check access
      const track = await db('tracks').where({ id: originalFeedback.track_id }).first();

      // Check if user has access to the project this track belongs to
      const projectMember = await db('project_members')
        .where({
          project_id: track.project_id,
          user_id: req.user?.userId,
        })
        .first();

      if (!projectMember) {
        return res.status(403).json({ message: 'Access denied to this track' });
      }

      // Create reply
      const now = new Date();
      const [replyId] = await db('feedback').insert({
        id: uuidv4(),
        track_id: originalFeedback.track_id,
        author_id: req.user?.userId,
        timestamp_seconds: originalFeedback.timestamp_seconds,
        category: originalFeedback.category,
        content,
        is_resolved: false,
        parent_id: req.params.id,
        created_at: now,
        updated_at: now,
      }).returning('id');

      // Get author details
      const author = await db('users')
        .where({ id: req.user?.userId })
        .select('id', 'username', 'profile_image_url')
        .first();

      // Notify clients in the track room
      io.to(`track-${originalFeedback.track_id}`).emit('new-reply', {
        id: replyId,
        parent_id: req.params.id,
        author,
        content,
        created_at: now,
      });

      res.status(201).json({
        id: replyId,
        parentId: req.params.id,
        content,
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT api/feedback/:id/resolve
// @desc    Mark feedback as resolved
// @access  Private
router.put('/:id/resolve', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get the feedback
    const feedback = await db('feedback').where({ id: req.params.id }).first();

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user is the author or track uploader
    const track = await db('tracks').where({ id: feedback.track_id }).first();

    if (feedback.author_id !== req.user?.userId && track.uploader_id !== req.user?.userId) {
      return res.status(403).json({ message: 'Not authorized to resolve this feedback' });
    }

    // Update feedback
    await db('feedback')
      .where({ id: req.params.id })
      .update({ is_resolved: true, updated_at: new Date() });

    // Notify clients in the track room
    io.to(`track-${feedback.track_id}`).emit('feedback-resolved', {
      id: req.params.id,
      resolvedBy: req.user?.userId,
    });

    res.json({ message: 'Feedback marked as resolved' });
  } catch (error) {
    console.error('Error resolving feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
