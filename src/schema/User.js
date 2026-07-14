const db = require('../database/database2');

class User {
  constructor(data = {}) {
    this._id = data.id || data._id;
    this.bio = data.bio || '';
    this.songsPlayed = data.songs_played || data.songsPlayed || 0;
    this.commandsUsed = data.commands_used || data.commandsUsed || 0;
    this.blacklisted = data.blacklisted === 1 || data.blacklisted === true ? true : false;
    this.developer = data.developer === 1 || data.developer === true ? true : false;
    this.songHistory = data.songHistory || [];
  }

  /**
   * Find a user by ID (Promise-based)
   * @param {string} userId - Discord user ID
   * @returns {Promise<User>}
   */
  static async findById(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, row) => {
        if (err) {
          return reject(err);
        }

        if (!row) {
          // Create a new user if it doesn't exist
          const newUser = new User({ _id: userId });
          
          db.run(
            'INSERT INTO users (id, bio, songs_played, commands_used, blacklisted, developer) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, '', 0, 0, 0, 0],
            (err) => {
              if (err) {
                return reject(err);
              }
              resolve(newUser);
            }
          );
          return;
        }

        // User found, create User instance
        const user = new User({
          _id: row.id,
          bio: row.bio,
          songs_played: row.songs_played,
          commands_used: row.commands_used,
          blacklisted: row.blacklisted === 1,
          developer: row.developer === 1
        });

        // Get user's song history
        db.all(`
          SELECT t.* FROM tracks t
          JOIN song_history sh ON t.id = sh.track_id
          WHERE sh.user_id = ?
          ORDER BY sh.played_at DESC
          LIMIT 10
        `, [userId], (err, tracks) => {
          if (err) {
            console.error('Error fetching song history:', err);
            return resolve(user);
          }

          user.songHistory = tracks.map(t => ({
            _id: t.id,
            title: t.title,
            url: t.url,
            author: t.author,
            duration: t.duration,
            thumbnail: t.thumbnail,
            platform: t.platform,
            playable: t.playable === 1
          }));

          resolve(user);
        });
      });
    });
  }

  /**
   * Save the user
   * @returns {Promise} Promise that resolves when user is saved
   */
  async save() {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO users (id, bio, songs_played, commands_used, blacklisted, developer) VALUES (?, ?, ?, ?, ?, ?)',
        [
          this._id,
          this.bio,
          this.songsPlayed,
          this.commandsUsed,
          this.blacklisted ? 1 : 0,
          this.developer ? 1 : 0
        ],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve(this);
        }
      );
    });
  }

  /**
   * Update user properties
   * @param {Object} updateData - Object with properties to update
   * @returns {Promise} Promise that resolves when update completes
   */
  async updateOne(updateData) {
    return new Promise((resolve, reject) => {
      // Build dynamic query
      const fields = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        let dbField = key;
        let dbValue = value;
        
        if (key === 'songsPlayed') {
          dbField = 'songs_played';
          this.songsPlayed = value;
        } else if (key === 'commandsUsed') {
          dbField = 'commands_used';
          this.commandsUsed = value;
        } else if (key === 'blacklisted') {
          this.blacklisted = value;
          dbValue = value ? 1 : 0;
        } else if (key === 'developer') {
          this.developer = value;
          dbValue = value ? 1 : 0;
        } else if (key === 'bio') {
          this.bio = value;
        } else {
          this[key] = value;
        }
        
        fields.push(`${dbField} = ?`);
        values.push(dbValue);
      }
      
      if (fields.length === 0) {
        return resolve({ modifiedCount: 0 });
      }
      
      values.push(this._id);
      
      db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ modifiedCount: this.changes });
      });
    });
  }
}

module.exports = User;