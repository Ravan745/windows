const { InteractionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require("discord.js");
const axios = require("axios");
const Prefix = require('../../models/prefix');
const FavPlay = require("../../models/playlist");
const DJSettings = require('../../models/dj');

module.exports = {
  name: 'interactionCreate',
  run: async (client, interaction, player) => {
    let prefix = client.prefix;
    const ress = await Prefix.findOne({ where: { id: interaction.guildId } });
    if (ress && ress.prefix) prefix = ress.prefix;

    if (interaction.isAutocomplete()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (command && typeof command.autocomplete === "function") {
        try {
          await command.autocomplete(client, interaction);
        } catch (error) {
          console.error("Autocomplete error:", error);
        }
      }
      return;
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.run(client, interaction, prefix);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(client.ankushcolor)
            .setDescription('An unexpected error occurred.')],
          ephemeral: true,
        }).catch(() => { });
      }
    }

    // Modern Streamlined Single-Row of 5 Buttons
    const prev = new ButtonBuilder()
      .setCustomId("prev")
      .setEmoji("⏮️")
      .setStyle(ButtonStyle.Secondary);

    const pause = new ButtonBuilder()
      .setCustomId("pause")
      .setEmoji("⏸️")
      .setStyle(ButtonStyle.Success);

    const resume = new ButtonBuilder()
      .setCustomId("resume")
      .setEmoji("▶️")
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

    const rowPlaying = new ActionRowBuilder().addComponents(prev, pause, skip, loop, stop);
    const rowPaused = new ActionRowBuilder().addComponents(prev, resume, skip, loop, stop);

    if (interaction.isButton()) {
      const player = client.manager.players.get(interaction.guild.id);
      
      if (!player) return interaction.message.delete().catch(() => {});

      if (!interaction.member.voice.channelId && interaction.user.id !== client.user.id && !client.config.ownerID.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(client.ankushcolor)
            .setDescription('You need to be in a voice channel to use this button!')],
          ephemeral: true
        });
      }

      if (interaction.member.voice.channelId !== player.voiceId && interaction.user.id !== client.user.id && !client.config.ownerID.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(client.ankushcolor)
            .setDescription('You need to be in the same voice channel as me to use this button!')],
          ephemeral: true
        });
      }

      // DJ Role Validation
      const djSettings = await DJSettings.findOne({ where: { id: interaction.guild.id } });
      if (djSettings && djSettings.roleId) {
        const isOwner = client.config.ownerID.includes(interaction.user.id) || interaction.user.id === "239496212699545601" || interaction.user.id === "622786214776406017";
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild);
        const hasDjRole = interaction.member.roles.cache.has(djSettings.roleId);
        const isRequester = player.queue.current && player.queue.current.requester && player.queue.current.requester.id === interaction.user.id;
        const voiceChannel = interaction.member.voice;
        const listeners = voiceChannel ? voiceChannel.members.filter(m => !m.user.bot).size : 0;
        const isAlone = listeners <= 1;

        if (!isOwner && !isAdmin && !hasDjRole && !isRequester && !isAlone) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#ff0000')
              .setDescription(`❌ | You are not allowed to control the music! This action requires the **DJ Role** (<@&${djSettings.roleId}>) or being the track requester.`)],
            ephemeral: true
          });
        }
      }

      switch (interaction.customId) {
        case "skip":
          if (player.paused) {
            interaction.reply({
              embeds: [new EmbedBuilder()
                .setColor(client.ankushcolor)
                .setDescription('Resume the player to skip the track!')],
              ephemeral: true
            });
          } else {
            player.skip();
            interaction.reply({
              embeds: [new EmbedBuilder()
                .setColor(client.ankushcolor)
                .setDescription('⏭️ | Skipped the current track!')],
              ephemeral: true
            });
          }
          break;

        case "stop":
          player.destroy();
          interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(client.ankushcolor)
              .setDescription('⏹️ | Stopped the player and cleared the queue!')],
            ephemeral: true
          });
          break;

        case "prev":
          let seektime = player.position - 10000;
          if (seektime >= player.queue.current.length - player.position || seektime < 0) {
            seektime = 0;
          }
          player.seek(Number(seektime));
          interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(client.ankushcolor)
              .setDescription('⏮️ | Rewound the track by 10 seconds!')],
            ephemeral: true
          });
          break;

        case "pause":
          player.pause(true);
          try {
            await interaction.update({ components: [rowPaused] });
          } catch (e) {
            console.log(e);
          }
          break;

        case "resume":
          player.pause(false);
          try {
            await interaction.update({ components: [rowPlaying] });
          } catch (e) {
            console.log(e);
          }
          break;

        case "loop2":
          player.setLoop();
          const loopStatus = player.loop === 'track' ? 'Track Loop' : (player.loop === 'queue' ? 'Queue Loop' : 'Loop Disabled');
          interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(client.ankushcolor)
              .setDescription(`🔁 | Loop mode changed to: **${loopStatus}**`)],
            ephemeral: true
          });
          break;
      }
    }
  }
};
