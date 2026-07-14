const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const DJSettings = require('../../models/dj');

module.exports = {
  name: 'dj',
  category: 'Settings',
  aliases: ['djrole', 'musicdj'],
  cooldown: 5,
  description: 'Configure the DJ role for this server. When active, only users with this role can skip, stop, pause, or loop songs.',
  args: false,
  usage: 'dj <set/disable/status> [@role/roleID]',
  userPrams: ['ManageGuild'],
  botPrams: ['EmbedLinks'],
  owner: false,
  execute: async (message, args, client, prefix) => {
    const subcommand = args[0] ? args[0].toLowerCase() : 'status';

    const embedColor = client.ankushcolor || '#ff0000';

    const guide = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
      .setTitle("🎧 DJ Role Configuration")
      .setDescription(`**dj set <@role/roleID>**\nSets the DJ role for this server.\n**dj disable**\nDisables DJ requirement (everyone can control music).\n**dj status**\nChecks the current DJ configuration.`)
      .setTimestamp();

    if (subcommand === 'set') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        return message.reply("❌ | Please mention a valid role or provide a valid Role ID.");
      }

      await DJSettings.upsert({
        id: message.guild.id,
        roleId: role.id
      });

      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle("🎧 DJ Role Configured")
        .setDescription(`Successfully set the DJ role to <@&${role.id}> (\`${role.name}\`) for this server!`)
        .setFooter({ text: "Now only DJs, requesters, and admins can use controls." })
        .setTimestamp();

      return message.reply({ embeds: [successEmbed] });
    }

    if (subcommand === 'disable') {
      const settings = await DJSettings.findOne({ where: { id: message.guild.id } });
      if (!settings || !settings.roleId) {
        return message.reply("❌ | DJ role is already disabled on this server.");
      }

      await settings.destroy();

      const disableEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle("🎧 DJ Role Disabled")
        .setDescription(`Successfully disabled the DJ role requirement. Anyone can control music now!`)
        .setTimestamp();

      return message.reply({ embeds: [disableEmbed] });
    }

    if (subcommand === 'status' || subcommand === 'check') {
      const settings = await DJSettings.findOne({ where: { id: message.guild.id } });
      const currentRole = settings?.roleId ? `<@&${settings.roleId}>` : '❌ Disabled (Anyone can control music)';

      const statusEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("🎧 Current DJ Status")
        .setDescription(`**DJ Role Requirement:** ${currentRole}`)
        .setTimestamp();

      return message.reply({ embeds: [statusEmbed] });
    }

    return message.reply({ embeds: [guide] });
  }
};
