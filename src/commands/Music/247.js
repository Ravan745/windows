const { EmbedBuilder } = require('discord.js');
const db = require("../../models/autoreconnect");
const Premium = require("../../models/premium");

module.exports = {
   name: '247',
   category: 'Music',
   aliases: ["alwayson"],
   description: 'Joins the voice channel for 24/7.',
   args: false,
   usage: '',
   userPrams: [],
   cooldown: 5,
   botPrams: ['EmbedLinks'],
   owner: false,
   player: false,
   inVoiceChannel: true,
   sameVoiceChannel: true,
   execute: async (message, args, client, prefix) => {
       const player = client.manager.players.get(message.guild.id);
       if (!player) {
           const embed = new EmbedBuilder()
               .setColor(client.ankushcolor || '#ff0000')
               .setDescription('❌ | There is no music playing in this server right now.');
           return message.reply({ embeds: [embed] });
       }

       // Premium check for 24/7
       const isPremium = await Premium.findOne({ where: { id: message.guild.id } });
       if (!isPremium) {
           const embed = new EmbedBuilder()
               .setColor('#ff0000')
               .setDescription('👑 | **24/7 Mode** is a premium-only feature! Please contact bot developers to upgrade this server.');
           return message.reply({ embeds: [embed] });
       }

       try {
           let data = await db.findOne({ where: { Guild: message.guild.id } });
           
           if (data) {
               // If 24/7 mode exists, disable it
               await data.destroy();
               
               const disabledEmbed = new EmbedBuilder()
                   .setColor(client.ankushcolor)
                   .setAuthor({
                       name: message.author.username,
                       iconURL: message.author.displayAvatarURL({ dynamic: true })
                   })
                   .setDescription('🔌 | 24/7 mode has been **disabled**')
                   .addFields(
                       {
                           name: 'Channel',
                           value: `<#${player.voiceId}>`,
                           inline: true
                       },
                       {
                           name: 'Status',
                           value: '⚪ Disabled',
                           inline: true
                       }
                   )
                   .setFooter({
                       text: 'Bot will now disconnect when queue ends'
                   })
                   .setTimestamp();
                   
               return message.reply({ embeds: [disabledEmbed] });
           } else {
               // If 24/7 mode doesn't exist, enable it
               data = await db.create({
                   Guild: player.guildId,
                   TextId: player.textId,
                   VoiceId: player.voiceId
               });

               const enabledEmbed = new EmbedBuilder()
                   .setColor(client.ankushcolor)
                   .setAuthor({
                       name: message.author.username,
                       iconURL: message.author.displayAvatarURL({ dynamic: true })
                   })
                   .setDescription('🔌 | 24/7 mode has been **enabled**')
                   .addFields(
                       {
                           name: 'Channel',
                           value: `<#${player.voiceId}>`,
                           inline: true
                       },
                       {
                           name: 'Status',
                           value: '🔵 Enabled',
                           inline: true
                       }
                   )
                   .setFooter({
                       text: 'Bot will now stay connected 24/7'
                   })
                   .setTimestamp();

               return message.reply({ embeds: [enabledEmbed] });
           }
       } catch (error) {
           console.error('24/7 mode error:', error);
           
           const errorEmbed = new EmbedBuilder()
               .setColor('#ff0000')
               .setDescription('❌ | An error occurred while toggling 24/7 mode.')
               .setTimestamp();
           return message.reply({ embeds: [errorEmbed] });
       }
   }
};