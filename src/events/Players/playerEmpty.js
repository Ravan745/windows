const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST } = require('discord.js');
const db2 = require("../../models/autoreconnect");
const { autoplay } = require("../../utils/functions");

module.exports = {
  name: 'playerEmpty',
  run: async (client, player) => {
    try {
      // Clean up previous message if it exists
      const prevMessage = player.data.get('message');
      if (prevMessage && prevMessage.deletable) {
        await prevMessage.delete().catch(() => null);
      }

      // Update voice status
      const voiceId = player.voiceId;
      if (voiceId) {
        try {
          await client.rest.put(`/channels/${voiceId}/voice-status`, {
            body: { status: "" }
          });
        } catch (e) {
          // Ignore voice status errors
        }
      }

      // Handle autoplay if enabled
      if (player.data.get("autoplay")) {
        const result = await autoplay(player, client);
        if (result) return;
      }

      // Get guild information
      let guild = client.guilds.cache.get(player.guildId);
      if (!guild) return;

      // Create the embed and buttons
      const embed = new EmbedBuilder()
        .setColor(client.ankushcolor)
        .setTitle('Queue Ended')
        .setDescription('No more songs in the queue. You can add more songs or invite me to your server!')
        .setTimestamp();

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Invite Me")
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Support Server")
            .setURL("https://discord.gg/w77ymEU82a")
        );

      // Check for 24/7 mode
      const TwoFourSeven = await db2.findOne({ where: { Guild: guild.id } });
      
      if (TwoFourSeven) {
        embed.setDescription('The queue is empty, but I\'m staying here because **24/7 Mode** is active.');
        
        const channel = client.channels.cache.get(player.textId);
        if (channel) {
          await channel.send({ embeds: [embed], components: [buttons] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => null), 10000);
          }).catch(() => null);
        }
      } else {
        embed.setDescription('The queue has ended. Disconnecting now.');
        
        const channel = client.channels.cache.get(player.textId);
        if (channel) {
          await channel.send({ embeds: [embed], components: [buttons] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => null), 10000);
          }).catch(() => null);
        }
        
        // Destroy the player
        await player.destroy();
      }

    } catch (error) {
      console.error('Error in playerEmpty event:', error);
    }
  },
};