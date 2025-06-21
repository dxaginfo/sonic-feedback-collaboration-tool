import express from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../config/db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @route   GET api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Get all projects where user is a member
    const projects = await db('projects')
      .join('project_members', 'projects.id', 'project_members.project_id')
      .where('project_members.user_id', req.user?.userId)
      .select(
        'projects.id',
        'projects.name',
        'projects.description',
        'projects.genre',
        'projects.status',
        'projects.is_private',
        'projects.created_at',
        'projects.updated_at'
      );

    res.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', param('id').isUUID(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user has access to this project
    const projectMember = await db('project_members')
      .where({
        project_id: req.params.id,
        user_id: req.user?.userId,
      })
      .first();

    if (!projectMember) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Get project details
    const project = await db('projects').where({ id: req.params.id }).first();

    // Get project members with their roles
    const members = await db('project_members')
      .join('users', 'project_members.user_id', 'users.id')
      .where('project_members.project_id', req.params.id)
      .select(
        'users.id',
        'users.username',
        'users.profile_image_url',
        'project_members.role',
        'project_members.joined_at'
      );

    // Get project tracks count
    const tracksCount = await db('tracks')
      .where({ project_id: req.params.id })
      .count('id as count')
      .first();

    res.json({
      ...project,
      members,
      tracksCount: tracksCount?.count || 0,
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  [
    body('name', 'Name is required').notEmpty(),
    body('description').optional(),
    body('genre').optional(),
    body('isPrivate').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, genre, isPrivate = true } = req.body;

    try {
      // Start a transaction
      await db.transaction(async (trx) => {
        // Create project
        const [projectId] = await trx('projects').insert({
          id: uuidv4(),
          owner_id: req.user?.userId,
          name,
          description,
          genre,
          status: 'active',
          is_private: isPrivate,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('id');

        // Add creator as project member with owner role
        await trx('project_members').insert({
          project_id: projectId,
          user_id: req.user?.userId,
          role: 'owner',
          joined_at: new Date(),
        });

        res.status(201).json({ id: projectId, name, description, genre, isPrivate });
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional(),
    body('description').optional(),
    body('genre').optional(),
    body('status').optional().isIn(['active', 'archived', 'completed']),
    body('isPrivate').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is owner or has rights to update
      const projectMember = await db('project_members')
        .where({
          project_id: req.params.id,
          user_id: req.user?.userId,
        })
        .first();

      if (!projectMember || projectMember.role !== 'owner') {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }

      const { name, description, genre, status, isPrivate } = req.body;

      const updateData: any = {
        updated_at: new Date(),
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (genre !== undefined) updateData.genre = genre;
      if (status !== undefined) updateData.status = status;
      if (isPrivate !== undefined) updateData.is_private = isPrivate;

      // Update project
      await db('projects').where({ id: req.params.id }).update(updateData);

      res.json({ message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST api/projects/:id/members
// @desc    Add a member to a project
// @access  Private
router.post(
  '/:id/members',
  [
    param('id').isUUID(),
    body('userId', 'User ID is required').isUUID(),
    body('role', 'Role is required').isIn(['collaborator', 'viewer']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, role } = req.body;

    try {
      // Check if user is owner or has rights to add members
      const projectMember = await db('project_members')
        .where({
          project_id: req.params.id,
          user_id: req.user?.userId,
        })
        .first();

      if (!projectMember || projectMember.role !== 'owner') {
        return res.status(403).json({ message: 'Not authorized to add members to this project' });
      }

      // Check if user already a member
      const existingMember = await db('project_members')
        .where({
          project_id: req.params.id,
          user_id: userId,
        })
        .first();

      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member of this project' });
      }

      // Add member
      await db('project_members').insert({
        project_id: req.params.id,
        user_id: userId,
        role,
        joined_at: new Date(),
      });

      res.status(201).json({ message: 'Member added successfully' });
    } catch (error) {
      console.error('Error adding project member:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE api/projects/:id/members/:userId
// @desc    Remove a member from a project
// @access  Private
router.delete('/:id/members/:userId', [param('id').isUUID(), param('userId').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is owner or removing themselves
    const projectMember = await db('project_members')
      .where({
        project_id: req.params.id,
        user_id: req.user?.userId,
      })
      .first();

    if (!projectMember) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Check if user is owner or removing themselves
    if (projectMember.role !== 'owner' && req.user?.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }

    // Remove member
    await db('project_members')
      .where({
        project_id: req.params.id,
        user_id: req.params.userId,
      })
      .delete();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
