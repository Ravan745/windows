const { EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, PermissionsBitField, ChannelType, WebhookClient } = require('discord.js');
const Maintenance = require('../../models/maintenance');
const { IgnoreChannel } = require('../../database');
const PrefixDB = require('../../models/prefix');
const NoPrefixDB = require('../../models/noprefix');
const Blacklist = require('../../models/blacklist');
const AFK = require('../../models/afk');
const User = require('../../schema/User');
const { cooldown } = require("../../handlers/functions.js");
const { RateLimitManager } = require("@sapphire/ratelimits");
const moment = require('moment');

const webHookurl = process.env.MESSAGE_LOG_WEBHOOK;
const hook = webHookurl ? new WebhookClient({ url: webHookurl }) : null;
const spamRateLimitManager = new RateLimitManager(10000, 7);
const commandRateLimitManager = new RateLimitManager(10000, 8);

const userReactions = {
  '622786214776406017': ['<:owner:1475040564461178910>', '<:Dev:1475040497666887770>', '<:Atul:1475040484886839327>'],
};

module.exports = {
  name: 'messageCreate',
  run: async (client, message) => {
    if (message.author.bot || message.webhookId || !message.guild || !message.channel) return;
    if (message.channel.type === ChannelType.DM || message.channel.type === ChannelType.GuildForum) return;
    if (message.partial) await message.fetch().catch(() => null);

    // AFK System
    try {
      const afkAuthor = await AFK.findOne({ where: { userId: message.author.id } });
      if (afkAuthor) {
        let prefix = client.prefixes.get(message.guild.id) || client.prefix;
        if (!message.content.toLowerCase().startsWith(`${prefix}afk`) && !message.content.toLowerCase().startsWith(`${prefix}away`)) {
          const afkTime = moment(afkAuthor.timestamp).fromNow(true);
          const mentions = afkAuthor.mentionCount || 0;
          await afkAuthor.destroy();

          try {
            if (message.member && message.member.manageable) {
              const currentNick = message.member.nickname || message.author.username;
              if (currentNick.startsWith('[AFK] ')) await message.member.setNickname(currentNick.substring(6)).catch(() => null);
            }
          } catch (err) {}

          const welcomeBack = await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.ankushcolor)
                .setAuthor({ name: `Welcome back ${message.author.username}!`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setDescription(`Your AFK status has been removed. You were AFK for ${afkTime} and received ${mentions} mention${mentions !== 1 ? 's' : ''}.`)
                .setTimestamp()
            ]
          }).catch(() => null);
          if (welcomeBack) setTimeout(() => welcomeBack.delete().catch(() => null), 10000);
        }
      }

      if (message.mentions.users.size > 0) {
        for (const [userId, user] of message.mentions.users) {
          if (userId === message.author.id) continue;
          const afkUser = await AFK.findOne({ where: { userId } });
          if (afkUser) {
            await afkUser.update({ mentionCount: (afkUser.mentionCount || 0) + 1 });
            const afkTime = moment(afkUser.timestamp).fromNow();
            const afkEmbed = new EmbedBuilder()
              .setColor('#FFA500')
              .setAuthor({ name: `${user.username} is AFK`, iconURL: user.displayAvatarURL({ dynamic: true }) })
              .setDescription(`${user.username} is currently AFK (since ${afkTime})\n**Reason:** ${afkUser.reason || 'No reason provided'}`)
              .setFooter({ text: 'They will see your message when they return' })
              .setTimestamp();
            await message.reply({ embeds: [afkEmbed] }).catch(() => null);
          }
        }
      }
    } catch (error) {
      console.error('Error in AFK handling:', error);
    }

    // Custom Reactions for mentions
    if (message.mentions.users.size > 0 && !message.reference) {
      for (const [userId, user] of message.mentions.users) {
        if (userReactions[userId]) {
          for (const reaction of userReactions[userId]) {
            await message.react(reaction).catch(() => null);
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }
    }

    // Owner Reactions
    if (client.config.ownerID.some(id => message.content.includes(`<@${id}>`)) && !message.reference) {
      const reactions = ['<:owner:1475040564461178910>', '<:Dev:1475040497666887770>', '<:Ankush:1475040482622050447>'];
      for (const r of reactions) {
        await message.react(r).catch(() => null);
        await new Promise(res => setTimeout(res, 300));
      }
    }

    // Dokdo / JSK
    if (message.content.toLowerCase().startsWith('jsk') || message.content.toLowerCase().startsWith('dokdo')) {
      if (client.config.ownerID.includes(message.author.id)) return client.dokdo.run(message);
    }

    const isOwner = client.config.ownerID.includes(message.author.id);
    const blacklisted = !isOwner && await Blacklist.findOne({ where: { userId: message.author.id } });
    if (blacklisted) return;

    // Maintenance check
    const maintenance = await Maintenance.findOne();
    if (maintenance?.isActive && !isOwner) {
      const mEmbed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('🚧 Maintenance Mode')
        .setDescription(`Bot is under maintenance.\n**Reason:** ${maintenance.reason || 'Maintenance'}`)
        .setTimestamp();
      return message.reply({ embeds: [mEmbed] }).catch(() => null);
    }

    // Prefix handling
    let prefix = client.prefixes.get(message.guild.id) || client.prefix;
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*$`);
    
    if (message.content.match(mentionRegex)) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=414530792776&scope=bot%20applications.commands`).setLabel('Invite'),
        new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(client.config.supportServer).setLabel('Support')
      );
      const embed = new EmbedBuilder()
        .setColor(client.ankushcolor)
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`Hey, I'm **${client.user.username}**, a high-quality music bot.`)
        .addFields([{ name: 'Settings', value: `Prefix: **${prefix}**\nServer ID: **${message.guild.id}**` }])
        .setFooter({ text: `Developed by Raahi`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      
      const bucket = spamRateLimitManager.acquire(message.author.id);
      if (bucket.limited && !isOwner) return;
      try { bucket.consume(); } catch(e) {}
      return message.reply({ embeds: [embed], components: [row] }).catch(() => null);
    }

    // NoPrefix Users
    if (client.noPrefix.has(message.author.id) && !message.content.startsWith(prefix)) {
      prefix = "";
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) return;

    const [matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const command = client.commands.get(cmdName) || client.commands.find(c => c.aliases && c.aliases.includes(cmdName));

    if (!command) return;

    // Channel check
    const ignored = await IgnoreChannel.findOne({ where: { guildId: message.guild.id, channelId: message.channel.id } });
    if (ignored && !isOwner) {
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('Commands are disabled in this channel.')] }).then(m => setTimeout(() => m.delete().catch(() => null), 5000)).catch(() => null);
    }

    // Command Rate Limit
    if (!isOwner) {
      const bucket = commandRateLimitManager.acquire(message.author.id);
      if (bucket.limited) {
        await Blacklist.create({ userId: message.author.id, reason: "Command Spam", date: new Date() });
        return message.reply("You have been blacklisted for spamming commands.").catch(() => null);
      }
      try { bucket.consume(); } catch(e) {}
    }

    // Permissions
    const me = message.guild.members.me;
    if (!me.permissions.has(PermissionsBitField.Flags.SendMessages)) return;
    if (!me.permissions.has(PermissionsBitField.Flags.EmbedLinks)) return message.channel.send("I need `Embed Links` permission.").catch(() => null);
    
    if (command.userPrams && !message.member.permissions.has(PermissionsBitField.resolve(command.userPrams))) {
      return message.reply(`Missing permissions: ${command.userPrams.join(', ')}`).then(m => setTimeout(() => m.delete().catch(() => null), 5000)).catch(() => null);
    }
    if (command.botPrams && !message.channel.permissionsFor(client.user.id).has(PermissionsBitField.resolve(command.botPrams))) {
      return message.reply(`I need permissions: ${command.botPrams.join(', ')}`).then(m => setTimeout(() => m.delete().catch(() => null), 5000)).catch(() => null);
    }

    // Owner check
    if (command.owner && !isOwner) return;

    // Cooldown
    const cooldownAmount = cooldown(message, command);
    if (cooldownAmount && !isOwner) {
      return message.reply(`Wait **${cooldownAmount.toFixed(1)}** seconds.`).catch(() => null);
    }

    // Player checks
    const player = client.manager.players.get(message.guild.id);
    if (command.player && !player) return message.reply("No music playing.").catch(() => null);
    if (command.inVoiceChannel && !message.member.voice.channelId) return message.reply("Join a voice channel first.").catch(() => null);
    if (command.sameVoiceChannel && me.voice.channelId && me.voice.channelId !== message.member.voice.channelId) return message.reply("Join my voice channel.").catch(() => null);

    // Logging
    if (hook) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
        .setDescription(`**Command:** ${command.name}\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel.name} (${message.channel.id})`)
        .setColor(client.ankushcolor)
        .setTimestamp();
      hook.send({ embeds: [logEmbed] }).catch(() => null);
    }

    // Execute
    try {
      await command.execute(message, args, client, prefix);
      const u = await User.findById(message.author.id);
      if (u) {
        u.commandsUsed = (u.commandsUsed || 0) + 1;
        await u.save().catch(() => null);
      }
    } catch (error) {
      console.error(error);
      message.reply("There was an error executing that command.").catch(() => null);
    }
  }
};
