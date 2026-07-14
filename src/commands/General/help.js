const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'help',
  category: 'General',
  aliases: ['helpp', 'h'],
  cooldown: 5,
  description: 'Help with all commands, or one specific command.',
  args: false,
  botPrams: [],
  owner: false,
  execute: async (message, args, client, prefix) => {
    const embedColor = client.ankushcolor || '#ff0000';
    
    if (!args[0]) {
      let helpmenu = new EmbedBuilder()
        .setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**Hey!!** <@${message.author.id}>, I am <@${client.user.id}>\n**Help Menu:**\n~ My default prefix is: ${prefix}\n~ Total Commands: \`${client.commands.size}\``)
        .setFields([
          { name: `Help Categories:`, value: `>>> <:Home:1475040515664646247> **: General**\n<:Music:1475040532219691150> **: Music**\n<:Filter:1475040502289268888> **: Filters**\n<:Playlist:1475040573013622937> **: Playlist**\n<:Setting:1475040575945314406> **: Settings**\n<:Spotify:1475040581968330917> **: Spotify**\n<:Favourite:1475040500045320264> **: Favourite**`, inline: false },
          { name: `~ Select A Category From Below`, value: `~ [Invite Me](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands) | [Support Server](${client.config.supportServer})`, inline: false }
        ])
        .setColor(embedColor);

      const row1 = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('helpop')
            .setPlaceholder('❯ SELECT A CATEGORY')
            .addOptions([
              {
                label: `Home`,
                description: 'Get Home Page',
                emoji: `<:Home:1475040515664646247>`,
                value: `h1`,
              },
              {
                label: 'General',
                description: 'View general commands',
                value: 'h2',
                emoji: `<:Home:1475040515664646247>`,
              },
              {
                label: 'Music',
                description: 'View music commands',
                value: 'h3',
                emoji: `<:Music:1475040532219691150>`,
              },
              {
                label: 'Filters',
                description: 'View filters commands',
                value: 'h4',
                emoji: `<:Filter:1475040502289268888>`,
              },
              {
                label: 'Playlist',
                description: 'View playlist commands',
                value: 'h5',
                emoji: `<:Playlist:1475040573013622937>`,
              },
              {
                label: 'Settings',
                description: 'View settings commands',
                value: 'h6',
                emoji: `<:Setting:1475040575945314406>`,
              },
              {
                label: 'Spotify',
                description: 'View Spotify commands',
                value: 'h8',
                emoji: `<:Spotify:1475040581968330917>`,
              },
              {
                label: 'Favourite',
                description: 'View favourite commands',
                value: 'h9',
                emoji: `<:Favourite:1475040500045320264>`,
              },
              {
                label: 'All Commands',
                description: 'View all commands',
                value: 'h10',
                emoji: `<:Commands:1475040490649813054>`,
              }
            ])
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Invite Me')
            .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setLabel('Support Server')
            .setURL(client.config.supportServer)
            .setStyle(ButtonStyle.Link)
        );

      const msg = await message.channel.send({ embeds: [helpmenu], components: [row1, row2] });

      let embed1 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`help\`**, **\`report\`**, **\`invite\`**, **\`ping\`**, **\`uptime\`**, **\`profile\`**, **\`stats\`**, **\`vote\`**, **\`checkvote\`**, **\`support\`**`).setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- General Commands`).setTimestamp();
      let embed2 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`247\`**, **\`autoplay\`**, **\`clearqueue\`**, **\`join\`**, **\`leave\`**, **\`forceskip\`**, **\`seek\`**, **\`grab\`**, **\`loop\`**, **\`move\`**, **\`nowplaying\`**, **\`pause\`**, **\`play\`**, **\`queue\`**, **\`remove\`**, **\`removedupes\`**, **\`replay\`**, **\`resume\`**, **\`rewind\`**, **\`search\`**, **\`shuffle\`**, **\`skip\`**, **\`skipto\`**, **\`stop\`**, **\`volume\`**`).setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- Music Commands`).setTimestamp();
      let embed3 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`pl-add\`**, **\`pl-addnowplaying\`**, **\`pl-addqueue\`**, **\`pl-create\`**, **\`pl-delete\`**, **\`pl-dupes\`**, **\`pl-info\`**, **\`pl-list\`**, **\`pl-load\`**, **\`pl-remove\`**`).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- Playlist Commands`).setTimestamp().setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      let embed4 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`8d\`**, **\`bass\`**, **\`clearfilters\`**, **\`dance\`**, **\`earrape\`**, **\`electronic\`**, **\`lofi\`**, **\`nightcore\`**, **\`party\`**, **\`pop\`**, **\`radio\`**, **\`rock\`**, **\`slowreverb\`**, **\`treblebass\`**, **\`vaporwave\`**, **\`darthvader\`**, **\`karaoke\`**`).setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- Filters Commands`).setTimestamp();
      let embed5 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`afk\`**, **\`prefix\`**, **\`ignorechannel\`**, **\`ownerinfo\`**, **\`avatar\`**, **\`banner\`**, **\`partner\`**, **\`moveme\`**`).setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- Settings Commands`).setTimestamp();
      let embed8 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`spotify login\`**, **\`spotify profile\`**, **\`spotify playlist\`**, **\`searchplaylist\`**, **\`spotify logout\`**`).setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- Spotify Commands`).setTimestamp();
      let embed9 = new EmbedBuilder().setColor(embedColor).setDescription(`**\`like\`**, **\`playliked\`**, **\`clearlikes\`**, **\`showliked\`**`).setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(client.user.displayAvatarURL({ dynamic: true })).setTitle(`- Favourite Commands`).setTimestamp();

      let allCommandsEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`${client.user.username} - All Commands`)
        .setDescription(
          `**__General Commands__:**\n${embed1.data.description}\n\n` +
          `**__Music Commands__:**\n${embed2.data.description}\n\n` +
          `**__Playlist Commands__:**\n${embed3.data.description}\n\n` +
          `**__Filters Commands__:**\n${embed4.data.description}\n\n` +
          `**__Settings Commands__:**\n${embed5.data.description}\n\n` +
          `**__Spotify Commands__:**\n${embed8.data.description}\n\n` +
          `**__Favourite Commands__:**\n${embed9.data.description}`
        )
        .setAuthor({ name: `${message.guild.name}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const collector = await msg.createMessageComponentCollector({
        filter: (interaction) => {
          if (message.author.id === interaction.user.id) return true;
          else {
            interaction.reply({ content: `<:x_cross:1475040602654642176> Only ${message.author.tag} can use this button!`, ephemeral: true });
          }
        },
        time: 100000,
        idle: 50000
      });

      collector.on('collect', async (interaction) => {
        if (interaction.isStringSelectMenu()) {
          for (const value of interaction.values) {
            if (value === `h1`) {
              return interaction.update({ embeds: [helpmenu], components: [row1, row2] });
            }
            if (value === `h2`) {
              return interaction.update({ embeds: [embed1], components: [row1, row2] });
            }
            if (value === `h3`) {
              return interaction.update({ embeds: [embed2], components: [row1, row2] });
            }
            if (value === `h4`) {
              return interaction.update({ embeds: [embed4], components: [row1, row2] });
            }
            if (value === `h5`) {
              return interaction.update({ embeds: [embed3], components: [row1, row2] });
            }
            if (value === `h6`) {
              return interaction.update({ embeds: [embed5], components: [row1, row2] });
            }
            if (value === `h8`) {
              return interaction.update({ embeds: [embed8], components: [row1, row2] });
            }
            if (value === `h9`) {
              return interaction.update({ embeds: [embed9], components: [row1, row2] });
            }
            if (value === `h10`) {
              return interaction.update({ embeds: [allCommandsEmbed], components: [row1, row2] });
            }
          }
        }
      });

      collector.on('end', async () => {
        msg.edit({ embeds: [helpmenu], components: [] }).catch(() => {});
      });
    }
  }
};
