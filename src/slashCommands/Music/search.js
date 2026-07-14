const { EmbedBuilder, ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "search",
  description: "Searches for songs and lets you choose one to play.",
  options: [
    {
      name: "query",
      description: "The song search query",
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

      const track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused) await player.play();
      return interaction.editReply(`Now playing: **[${track.title}](${track.uri})** by ${track.author}`);
    } catch (error) {
      console.error(error);
      return interaction.editReply(`An error occurred: ${error.message}`).catch(() => {});
    }
  },
  autocomplete: async (client, interaction) => {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) {
      return interaction.respond([]).catch(() => {});
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
