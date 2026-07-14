const { EmbedBuilder } = require("discord.js");
const os = require('os');
const process = require('process');
const { hasVotePermission } = require('../../utils/voteCheck');

module.exports = {
  name: 'stats',
  category: 'General',
  aliases: ['st', 'status', 'botinfo'],
  cooldown: 5,
  description: 'Displays comprehensive bot statistics including system resources, performance metrics, and version information.',
  args: false,
  usage: '',
  userPerms: [],
  botPerms: ['EmbedLinks'],
  owner: false,
  execute: async (message, args, client, prefix) => {
    try {
      // Check if user has voted
      const hasVoted = await hasVotePermission(message.author.id, client);
      if (!hasVoted) {
        return message.reply("This command requires you to vote for the bot! Use the `vote` command to learn more.");
      }
      
      // Calculate various stats
      const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
      
      const uptimeTimestamp = Math.floor((Date.now() - client.uptime) / 1000);
      const serverCount = client.guilds.cache.size;
      const channelCount = client.channels.cache.size;
      
      // Calculate memory usage
      const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2); // Convert to GB
      const memoryPercentage = ((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1);

      // Get CPU info safely
      const cpus = os.cpus();
      const cpuModel = cpus && cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';
      const cpuCores = cpus ? cpus.length : 0;
      
      // Get Discord.js version safely
      let discordJSVersion = 'Unknown';
      try {
        discordJSVersion = require("discord.js").version;
      } catch (e) {
        console.error('Could not get Discord.js version:', e);
      }
      
      // Create embed with modern styling
      const embed = new EmbedBuilder()
        .setColor(client.config?.embedColor || '#ff0000')
        .setAuthor({
          name: `${client.user.username} Statistics`,
          iconURL: client.user.displayAvatarURL({ dynamic: true, size: 64 })
        })
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`[**Support Server**](https://discord.com/invite/w77ymEU82a)`)
        .addFields([
          {
            name: '__Bot Statistics__',
            value: [
              `<:users:1475040593930358858> Users: \`${totalMembers.toLocaleString()}\``,
              `<:Home:1475040515664646247> Servers: \`${serverCount.toLocaleString()}\``,
              `<:Commands:1475040490649813054> Commands: \`${client.commands.size}\``,
              // `<a:red_dot:1330454614067380275> Channels: \`${channelCount.toLocaleString()}\``,
              `<:Setting:1475040575945314406> Uptime: <t:${uptimeTimestamp}:R>`
            ].join('\n'),
            inline: false
          },
          {
            name: '__System Information__',
            value: [
              `<:Dev:1475040497666887770> CPU: \`${cpuModel}\``,
              `<:Manager:1475040518869094420> CPU Cores: \`${cpuCores}\``,
              `<:Music:1475040532219691150> Memory: \`${usedMemory}MB / ${totalMemory}GB (${memoryPercentage}%)\``,
              `<:Source:1475040578579202191> Platform: \`${os.platform()} ${os.arch()}\``
            ].join('\n'),
            inline: false
          },
          {
            name: '__Technical Details__',
            value: [
              `<:tick:1475040591313109114> API Latency: \`${client.ws.ping}ms\``,
              `<:verified:1475040596463976619> Node.js: \`${process.version}\``,
              `<:Partner:1475040566650867896> Discord.js: \`v${discordJSVersion}\``
            ].join('\n'),
            inline: false
          }
        ])
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 })
        })
        .setTimestamp();

      // Add support server link if configured
      if (client.config?.supportServer) {
        embed.addFields({
          name: '__Links__',
          value: `[**Support Server**](${client.config.supportServer})`,
          inline: false
        });
      }

      await message.reply({ embeds: [embed] }).catch(err => {
        console.error('Error sending embed:', err);
        message.channel.send('Failed to display statistics. Please check bot permissions.').catch(() => {});
      });
    } catch (error) {
      console.error('Error in stats command:', error);
      await message.reply('An error occurred while fetching bot statistics. Please try again later.').catch(() => {});
    }
  }
};