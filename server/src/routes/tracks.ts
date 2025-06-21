import express from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { io } from '../index';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tracks/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['.mp3', '.wav', '.flac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (mp3, wav, flac) are allowed'));
    }
  },
});

// @route   GET api/tracks/project/:projectId
// @desc    Get all tracks for a project
// @access  Private
router.get('/project/:projectId', param('projectId').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user has access to this project
    const projectMember = await db('project_members')
      .where({
        project_id: req.params.projectId,
        user_id: req.user?.userId,
      })
      .first();

    if (!projectMember) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Get all tracks for the project
    const tracks = await db('tracks')
      .where({ project_id: req.params.projectId })
      .orderBy('created_at', 'desc');

    // Get feedback counts for each track
    const trackIds = tracks.map(track => track.id);
    const feedbackCounts = await db('feedback')
      .whereIn('track_id', trackIds)
      .count('id as count')
      .groupBy('track_id')
      .select('track_id');

    // Create a map of track_id to feedback count
    const feedbackCountMap = feedbackCounts.reduce((acc, item) => {
      acc[item.track_id] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    // Add feedback count to each track
    const tracksWithCounts = tracks.map(track => ({
      ...track,
      feedbackCount: feedbackCountMap[track.id] || 0,
    }));

    res.json(tracksWithCounts);
  } catch (error) {
    console.error('Error getting tracks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/tracks/:id
// @desc    Get track by ID
// @access  Private
router.get('/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get track details
    const track = await db('tracks').where({ id: req.params.id }).first();

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

    // Get uploader details
    const uploader = await db('users')
      .where({ id: track.uploader_id })
      .select('id', 'username', 'profile_image_url')
      .first();

    // Get project details
    const project = await db('projects')
      .where({ id: track.project_id })
      .select('id', 'name')
      .first();

    // Get version history
    const versions = await db('tracks')
      .where({ project_id: track.project_id })
      .whereRaw('title = ? AND id != ?', [track.title, track.id])
      .orderBy('version_number', 'desc')
      .select('id', 'version_number', 'created_at');

    res.json({
      ...track,
      uploader,
      project,
      versions,
    });
  } catch (error) {
    console.error('Error getting track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/tracks
// @desc    Upload a new track
// @access  Private
router.post(
  '/',
  [
    upload.single('audioFile'),
    body('projectId', 'Project ID is required').isUUID(),
    body('title', 'Title is required').notEmpty(),
    body('description').optional(),
    body('bpm').optional().isNumeric(),
    body('key').optional(),
    body('versionNumber').optional().isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    const { projectId, title, description, bpm, key, versionNumber = 1 } = req.body;

    try {
      // Check if user has access to this project
      const projectMember = await db('project_members')
        .where({
          project_id: projectId,
          user_id: req.user?.userId,
        })
        .first();

      if (!projectMember) {
        return res.status(403).json({ message: 'Not authorized to upload to this project' });
      }

      // If this is a new version of an existing track, update previous versions
      if (versionNumber > 1) {
        await db('tracks')
          .where({ project_id: projectId, title, is_latest: true })
          .update({ is_latest: false });
      }

      // Get file information
      const fileUrl = req.file.path;
      const fileFormat = path.extname(req.file.originalname).substring(1).toUpperCase();
      const duration = 180; // This would be extracted from the audio file in a real app

      // Create track record
      const [trackId] = await db('tracks').insert({
        id: uuidv4(),
        project_id: projectId,
        uploader_id: req.user?.userId,
        title,
        description,
        file_url: fileUrl,
        file_format: fileFormat,
        duration_seconds: duration,
        bpm: bpm || null,
        key: key || null,
        version_number: versionNumber,
        is_latest: true,
        created_at: new Date(),
      }).returning('id');

      // Notify project members about the new track
      io.to(`project-${projectId}`).emit('track-uploaded', {
        trackId,
        title,
        uploaderName: req.user?.userId, // This would be username in a real app
      });

      res.status(201).json({
        id: trackId,
        title,
        projectId,
        fileUrl,
        versionNumber,
      });
    } catch (error) {
      console.error('Error uploading track:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT api/tracks/:id
// @desc    Update track details
// @access  Private
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional(),
    body('description').optional(),
    body('bpm').optional().isNumeric(),
    body('key').optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Get track
      const track = await db('tracks').where({ id: req.params.id }).first();

      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }

      // Check if user is the uploader or project owner
      if (track.uploader_id !== req.user?.userId) {
        const projectMember = await db('project_members')
          .where({
            project_id: track.project_id,
            user_id: req.user?.userId,
            role: 'owner',
          })
          .first();

        if (!projectMember) {
          return res.status(403).json({ message: 'Not authorized to update this track' });
        }
      }

      const { title, description, bpm, key } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (bpm !== undefined) updateData.bpm = bpm;
      if (key !== undefined) updateData.key = key;

      // Update track
      await db('tracks').where({ id: req.params.id }).update(updateData);

      res.json({ message: 'Track updated successfully' });
    } catch (error) {
      console.error('Error updating track:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE api/tracks/:id
// @desc    Delete a track
// @access  Private
router.delete('/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get track
    const track = await db('tracks').where({ id: req.params.id }).first();

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Check if user is the uploader or project owner
    if (track.uploader_id !== req.user?.userId) {
      const projectMember = await db('project_members')
        .where({
          project_id: track.project_id,
          user_id: req.user?.userId,
          role: 'owner',
        })
        .first();

      if (!projectMember) {
        return res.status(403).json({ message: 'Not authorized to delete this track' });
      }
    }

    // Delete track (in a real app, you would also delete the file)
    await db('tracks').where({ id: req.params.id }).delete();

    // If this was the latest version, update the previous version to be latest
    if (track.is_latest) {
      const previousVersion = await db('tracks')
        .where({ project_id: track.project_id, title: track.title })
        .orderBy('version_number', 'desc')
        .first();

      if (previousVersion) {
        await db('tracks')
          .where({ id: previousVersion.id })
          .update({ is_latest: true });
      }
    }

    res.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
