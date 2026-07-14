const { EmbedBuilder, ActionRowBuilder, AttachmentBuilder, Client, ButtonBuilder, ButtonStyle, REST } = require('discord.js');
const { KazagumoPlayer, KazagumoTrack } = require("kazagumo");
const { savePlayerSession } = require("../../utils/functions");

module.exports = {
  name: "playerStart",
  /**
   * @param {Client} client 
   * @param {KazagumoPlayer} player 
   * @param {KazagumoTrack} track 
   */
  run: async (client, player, track) => {
    if (!client || !player || !track) {
      console.error('Missing required parameters:', { client: !!client, player: !!player, track: !!track });
      return;
    }

    let guild = client.guilds.cache.get(player.guildId);
    if (!guild) {
      console.error('Guild not found:', player.guildId);
      return;
    }

    let channel = guild.channels.cache.get(player.textId);
    if (!channel) {
      console.error('Channel not found:', player.textId);
      return;
    }

    if (track.uri && track.uri.includes("https://cdn.discordapp.com/attachments/")) {
      return;
    }

    try {
      track.requester = player.previous
        ? player.queue.previous?.requester
        : player.queue.current?.requester;
    } catch (err) {
      console.error('Error setting track requester:', err);
    }

    const author1 = track.author || 'Unknown Artist';
    const voiceId = player.voiceId;
    const status = `${author1} - ${track.title || 'Unknown Title'}`;

    try {
      await client.rest.put(`/channels/${voiceId}/voice-status`, {
        body: { status: status.substring(0, 100) }
      });
    } catch (err) {
      console.error('Error updating voice status:', err);
    }

    // Modern Single-Row of 5 High-Impact Buttons (The Modern "Less is More" standard)
    const prev = new ButtonBuilder()
      .setCustomId("prev")
      .setEmoji("⏮️")
      .setStyle(ButtonStyle.Secondary);

    const pause = new ButtonBuilder()
      .setCustomId("pause")
      .setEmoji("⏸️")
      .setStyle(ButtonStyle.Success);

    const skip = new ButtonBuilder()
      .setCustomId("skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary);

    const loop = new ButtonBuilder()
      .setCustomId("loop2")
      .setEmoji("🔁")
      .setStyle(ButtonStyle.Secondary);

    const stop = new ButtonBuilder()
      .setCustomId("stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(prev, pause, skip, loop, stop);

    try {
      const embedResult = await client.canvas.build(track, player);
      
      if (!embedResult || !embedResult.embeds) {
        throw new Error('Invalid embed result from EmbedHandler');
      }

      const message = await channel.send({
        embeds: embedResult.embeds,
        files: embedResult.files || [],
        components: [row]
      });

      if (message) {
        await player.data.set("message", message);
        await player.data.set("autoplaySystem", {
          title: track.title || 'Unknown Title',
          author: track.author || 'Unknown Artist',
          requester: track.requester
        });
        await player.data.set("requester", track.requester);
        await savePlayerSession(player).catch(() => {});
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      try {
        const fallbackMessage = await channel.send({
          content: `Now playing: **${track.title || 'Unknown Title'}** by ${track.author || 'Unknown Artist'}`,
          components: [row]
        });
        
        if (fallbackMessage) {
          await player.data.set("message", fallbackMessage);
          await player.data.set("autoplaySystem", {
            title: track.title || 'Unknown Title',
            author: track.author || 'Unknown Artist',
            requester: track.requester
          });
          await player.data.set("requester", track.requester);
        }
      } catch (fallbackErr) {
        console.error('Error sending fallback message:', fallbackErr);
      }
    }
  }
};