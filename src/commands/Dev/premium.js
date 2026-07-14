const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const Premium = require('../../models/premium');

// Owner permissions - only these IDs can manage premium
const OwnerPermission = [
  "239496212699545601", "622786214776406017", "677952614390038559"
];

// Helper function to check premium status
async function getPremiumStatus(id) {
  const premium = await Premium.findOne({ where: { id: id } });
  if (!premium) return { hasPremium: false };
  
  if (premium.expiresAt && new Date() > premium.expiresAt) {
    await premium.destroy();
    return { hasPremium: false, expired: true };
  }
  
  return { hasPremium: true, data: premium };
}

module.exports = {
  name: 'premium',
  category: 'Dev',
  aliases: ['prem'],
  cooldown: 5,
  description: 'Manage premium users and guilds (servers)',
  args: false,
  usage: 'premium <add/remove/list/check> <userID/guildID> [duration_days]',
  userPerms: [],
  botPerms: ['EmbedLinks'],
  owner: true,
  player: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  
  execute: async (message, args, client, prefix) => {
    // Only allow owners to manage premium
    if (!OwnerPermission.includes(message.author.id) && !client.config.ownerID.includes(message.author.id)) {
      return message.channel.send("❌ | You don't have permission to use this command.");
    }

    const subcommand = args[0];
    
    const guide = new EmbedBuilder()
      .setColor(client.ankushcolor || '#ff0000')
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
      .setTitle("👑 Premium Management System")
      .setDescription(`**premium add <user/guildID> [duration_days]**\nAdd a user or guild to the premium list. (Example: \`premium add 1234567890 30\`)\n**premium remove <user/guildID>**\nRemove a user or guild from premium.\n**premium list**\nShows all premium users and guilds.\n**premium check <user/guildID>**\nCheck premium status and expiration details.`)
      .setTimestamp();

    if (!subcommand) {
      return message.channel.send({ embeds: [guide] });
    }

    switch (subcommand.toLowerCase()) {
      case 'add': {
        const targetId = args[1];
        if (!targetId || !/^\d{17,19}$/.test(targetId)) {
          return message.channel.send("❌ | Please provide a valid User ID or Guild ID.");
        }

        const durationDays = args[2] ? parseInt(args[2]) : null;
        if (args[2] && (isNaN(durationDays) || durationDays <= 0)) {
          return message.channel.send("❌ | Duration days must be a positive number.");
        }

        // Determine type (user or guild) by checking if the guild exists in cache, or prompt/default
        let type = 'guild';
        const guildCheck = client.guilds.cache.has(targetId);
        if (!guildCheck) {
          try {
            const userCheck = await client.users.fetch(targetId).catch(() => null);
            if (userCheck) type = 'user';
          } catch (e) {}
        }

        const expiresAt = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

        await Premium.upsert({
          id: targetId,
          type: type,
          addedBy: message.author.id,
          expiresAt: expiresAt
        });

        const expiryStr = expiresAt ? `for **${durationDays} days** (Expires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : 'for **Lifetime**';

        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle("👑 Premium Added")
          .setDescription(`Successfully added premium to ${type === 'guild' ? 'Server/Guild' : 'User'} **${targetId}** ${expiryStr}!`)
          .setTimestamp();

        return message.channel.send({ embeds: [successEmbed] });
      }

      case 'remove': {
        const targetId = args[1];
        if (!targetId || !/^\d{17,19}$/.test(targetId)) {
          return message.channel.send("❌ | Please provide a valid User ID or Guild ID.");
        }

        const premium = await Premium.findOne({ where: { id: targetId } });
        if (!premium) {
          return message.channel.send(`❌ | **${targetId}** does not have premium active.`);
        }

        await premium.destroy();

        const removeEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle("👑 Premium Removed")
          .setDescription(`Successfully removed premium from **${targetId}**.`)
          .setTimestamp();

        return message.channel.send({ embeds: [removeEmbed] });
      }

      case 'check': {
        const targetId = args[1] || message.guild.id;
        if (!/^\d{17,19}$/.test(targetId)) {
          return message.channel.send("❌ | Please provide a valid User ID or Guild ID.");
        }

        const status = await getPremiumStatus(targetId);

        if (!status.hasPremium) {
          return message.channel.send({
            embeds: [new EmbedBuilder()
              .setColor('#ff0000')
              .setDescription(`❌ | **${targetId}** does not have an active Premium subscription.`)]
          });
        }

        const expiresStr = status.data.expiresAt 
          ? `<t:${Math.floor(status.data.expiresAt.getTime() / 1000)}:F> (<t:${Math.floor(status.data.expiresAt.getTime() / 1000)}:R>)` 
          : '♾️ Lifetime / Permanent';

        const checkEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle("👑 Premium Status Check")
          .addFields(
            { name: 'Target ID', value: `\`${targetId}\``, inline: true },
            { name: 'Type', value: `\`${status.data.type.toUpperCase()}\``, inline: true },
            { name: 'Added By', value: `<@${status.data.addedBy}>`, inline: true },
            { name: 'Expires At', value: expiresStr, inline: false }
          )
          .setTimestamp();

        return message.channel.send({ embeds: [checkEmbed] });
      }

      case 'list': {
        const listData = await Premium.findAll();

        if (!listData || listData.length === 0) {
          return message.channel.send("❌ | No premium users or servers to show.");
        }

        const totalPages = Math.ceil(listData.length / 10);
        let currentPage = 0;

        const generateEmbed = (page) => {
          const startIndex = page * 10;
          const endIndex = Math.min(startIndex + 10, listData.length);
          const currentPremiums = listData.slice(startIndex, endIndex);

          const listStr = currentPremiums.map((p, index) => {
            const exp = p.expiresAt ? `<t:${Math.floor(p.expiresAt.getTime() / 1000)}:R>` : 'Lifetime';
            return `\`[${startIndex + index + 1}]\` | **ID:** \`${p.id}\` | **Type:** \`${p.type.toUpperCase()}\` | **Expires:** ${exp}`;
          }).join("\n");

          return new EmbedBuilder()
            .setColor(client.ankushcolor || '#ff0000')
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle(`👑 Premium Members - Page ${page + 1}/${totalPages}`)
            .setDescription(listStr)
            .setFooter({ text: `Total premium registrations: ${listData.length}` });
        };

        const createPageDropdown = (totalPages) => {
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("prem_page_select")
            .setPlaceholder("Select a page to view");
          
          for (let i = 0; i < totalPages; i++) {
            selectMenu.addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel(`Page ${i + 1}`)
                .setValue(`${i}`)
                .setDescription(`View entries ${i * 10 + 1}-${Math.min((i + 1) * 10, listData.length)}`)
            );
          }
          
          return new ActionRowBuilder().addComponents(selectMenu);
        };

        const closeButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setCustomId("prem_close")
            .setLabel("Close")
        );

        const initialEmbed = generateEmbed(currentPage);
        const components = [];
        if (totalPages > 1) {
          components.push(createPageDropdown(totalPages));
        }
        components.push(closeButton);

        const activeMessage = await message.channel.send({ 
          embeds: [initialEmbed], 
          components: components
        });

        const collector = activeMessage.createMessageComponentCollector({
          filter: (i) => i.user.id === message.author.id,
          time: 120000,
          idle: 60000
        });

        collector.on("collect", async (interaction) => {
          if (interaction.customId === "prem_close") {
            collector.stop("user");
            return;
          } 
          
          if (interaction.customId === "prem_page_select") {
            currentPage = parseInt(interaction.values[0]);
            const newEmbed = generateEmbed(currentPage);
            await interaction.update({ 
              embeds: [newEmbed],
              components: components
            });
          }
        });

        collector.on("end", async (collected, reason) => {
          if (reason === "user") {
            await activeMessage.delete().catch(() => {});
          } else {
            await activeMessage.edit({ components: [] }).catch(() => {});
          }
        });

        break;
      }

      default: {
        return message.channel.send({ embeds: [guide] });
      }
    }
  }
};
