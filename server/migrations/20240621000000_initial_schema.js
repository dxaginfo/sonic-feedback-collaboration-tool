/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Users Table
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('username', 50).notNullable().unique();
      table.string('email', 100).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 50);
      table.string('last_name', 50);
      table.string('profile_image_url', 255);
      table.text('bio');
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').notNullable();
    })
    
    // Projects Table
    .createTable('projects', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('owner_id').references('id').inTable('users').notNullable().onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.text('description');
      table.string('genre', 50);
      table.enum('status', ['active', 'archived', 'completed']).notNullable().defaultTo('active');
      table.boolean('is_private').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').notNullable();
    })
    
    // Project Members Table
    .createTable('project_members', (table) => {
      table.uuid('project_id').references('id').inTable('projects').notNullable().onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').notNullable().onDelete('CASCADE');
      table.enum('role', ['owner', 'collaborator', 'viewer']).notNullable();
      table.timestamp('joined_at').notNullable();
      table.primary(['project_id', 'user_id']);
    })
    
    // Tracks Table
    .createTable('tracks', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('project_id').references('id').inTable('projects').notNullable().onDelete('CASCADE');
      table.uuid('uploader_id').references('id').inTable('users').notNullable().onDelete('CASCADE');
      table.string('title', 100).notNullable();
      table.text('description');
      table.string('file_url', 255).notNullable();
      table.string('file_format', 10).notNullable();
      table.integer('duration_seconds').notNullable();
      table.smallint('bpm');
      table.string('key', 10);
      table.integer('version_number').notNullable();
      table.boolean('is_latest').notNullable();
      table.timestamp('created_at').notNullable();
      
      // Composite index for finding tracks by project and title
      table.index(['project_id', 'title']);
    })
    
    // Feedback Table
    .createTable('feedback', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('track_id').references('id').inTable('tracks').notNullable().onDelete('CASCADE');
      table.uuid('author_id').references('id').inTable('users').notNullable().onDelete('CASCADE');
      table.decimal('timestamp_seconds', 10, 3);
      table.enum('category', ['mixing', 'composition', 'performance', 'general']).notNullable();
      table.text('content').notNullable();
      table.boolean('is_resolved').notNullable().defaultTo(false);
      table.uuid('parent_id').references('id').inTable('feedback').onDelete('CASCADE');
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').notNullable();
      
      // Index for finding feedback by track
      table.index('track_id');
      // Index for finding replies to a feedback
      table.index('parent_id');
    })
    
    // Track Comparisons Table
    .createTable('track_comparisons', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('original_track_id').references('id').inTable('tracks').notNullable().onDelete('CASCADE');
      table.uuid('comparison_track_id').references('id').inTable('tracks').notNullable().onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').notNullable().onDelete('CASCADE');
      table.text('notes');
      table.timestamp('created_at').notNullable();
    })
    
    // Notifications Table
    .createTable('notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').notNullable().onDelete('CASCADE');
      table.enum('type', ['new_feedback', 'mention', 'version_upload', 'project_invitation']).notNullable();
      table.text('content').notNullable();
      table.uuid('related_id');
      table.boolean('is_read').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable();
      
      // Index for finding notifications by user
      table.index('user_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('track_comparisons')
    .dropTableIfExists('feedback')
    .dropTableIfExists('tracks')
    .dropTableIfExists('project_members')
    .dropTableIfExists('projects')
    .dropTableIfExists('users');
};
