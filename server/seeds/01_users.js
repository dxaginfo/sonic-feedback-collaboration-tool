const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Default password for seeded users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  const now = new Date();
  
  // Add seed users
  await knex('users').insert([
    {
      id: uuidv4(),
      username: 'john_doe',
      email: 'john@example.com',
      password_hash: hashedPassword,
      first_name: 'John',
      last_name: 'Doe',
      profile_image_url: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'Music producer and guitarist with 10 years of experience.',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      username: 'jane_smith',
      email: 'jane@example.com',
      password_hash: hashedPassword,
      first_name: 'Jane',
      last_name: 'Smith',
      profile_image_url: 'https://randomuser.me/api/portraits/women/2.jpg',
      bio: 'Singer-songwriter specializing in indie folk music.',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      username: 'mike_producer',
      email: 'mike@example.com',
      password_hash: hashedPassword,
      first_name: 'Mike',
      last_name: 'Johnson',
      profile_image_url: 'https://randomuser.me/api/portraits/men/3.jpg',
      bio: 'Mixing and mastering engineer with a focus on electronic music.',
      created_at: now,
      updated_at: now,
    },
  ]);
};
