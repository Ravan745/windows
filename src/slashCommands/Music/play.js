const { EmbedBuilder, ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "play",
  description: "Plays a song or playlist in your voice channel.",
  options: [
    {
      name: "query",
      description: "The name or URL of the song/playlist to play.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    }
  ],
  run: async (client, interaction) => {
    try {
      await interaction.deferReply();
      
      const { channel } = interaction.member.voice;
      if (!channel) {
        return interaction.editReply("You need to be in a voice channel to use this command.");
      }
      
      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.resolve(["Speak", "Connect"]))) {
        return interaction.editReply("I don't have permission to connect or speak in your voice channel.");
      }

      if (!interaction.guild.members.cache
        .get(client.user.id)
        .permissionsIn(channel)
        .has(PermissionsBitField.resolve(["Speak", "Connect"]))) {
        return interaction.editReply("I don't have permission to join and speak in your voice channel.");
      }

      const query = interaction.options.getString("query");

      let player = client.manager.players.get(interaction.guildId);
      if (!player) {
        player = await client.manager.createPlayer({
          guildId: interaction.guildId,
          voiceId: channel.id,
          textId: interaction.channelId,
          shardId: interaction.guild.shardId || 0,
          deaf: true,
        });
      }

      const res = await player.search(query, { requester: interaction.user });
      if (!res || !res.tracks || !res.tracks.length) {
        return interaction.editReply("No results found for your query.");
      }

      const MIN_DURATION = 30000;

      if (res.type === 'PLAYLIST') {
        const validTracks = res.tracks.filter(track => track.isStream || track.length >= MIN_DURATION);
        if (!validTracks.length) {
          return interaction.editReply("No songs in this playlist are streams or longer than 30 seconds.");
        }
        for (const track of validTracks) {
          player.queue.add(track);
        }
        if (!player.playing && !player.paused) await player.play();
        
        const playlistName = res.playlist?.name || "Unknown Playlist";
        return interaction.editReply(`Loaded playlist **${playlistName}** with ${validTracks.length} tracks.`);
      } else {
        const track = res.tracks[0];
        if (!track.isStream && track.length < MIN_DURATION) {
          return interaction.editReply("This track is shorter than 30 seconds and cannot be played.");
        }
        player.queue.add(track);
        if (!player.playing && !player.paused) await player.play();
        return interaction.editReply(`Added **[${track.title}](${track.uri})** to the queue.`);
      }
    } catch (error) {
      console.error("Error in play slash command:", error);
      return interaction.editReply(`An error occurred: ${error.message}`).catch(() => {});
    }
  },
  autocomplete: async (client, interaction) => {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) {
      return interaction.respond([
        { name: "🎵 Type a song name or paste a URL", value: "https://open.spotify.com/playlist/37i9dQZF1DX10zKzsJki8g" }
      ]).catch(() => {});
    }

    try {
      const searchResult = await client.manager.search(focusedValue, { requester: interaction.user });
      if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
        const choices = searchResult.tracks.slice(0, 10).map(track => {
          const name = `${track.title} - ${track.author}`.substring(0, 100);
          return { name, value: track.uri || track.title };
        });
        await interaction.respond(choices).catch(() => {});
      } else {
        await interaction.respond([]).catch(() => {});
      }
    } catch (e) {
      await interaction.respond([]).catch(() => {});
    }
  }
};
