const { EmbedBuilder } = require("discord.js");
const User = require('../../schema/User');

module.exports = {
  name: 'profile',
  category: 'General',
  aliases: ['pf', 'pr'],
  cooldown: 5,
  description: 'View your profile or someone else\'s profile',
  args: false,
  usage: '[user mention or ID]',
  userPrams: [],
  botPrams: [],
  owner: false,
  execute: async (message, args, client, prefix) => {
    await message.channel.sendTyping();
    
    // Get the target user: mentioned user, user ID, or message author
    let targetMember;
    
    if (args[0]) {
      // Check if it's a mention
      if (message.mentions.members.size > 0) {
        targetMember = message.mentions.members.first();
      } 
      // Check if it's a valid ID
      else if (/^\d{17,19}$/.test(args[0])) {
        try {
          targetMember = await message.guild.members.fetch(args[0]);
        } catch (error) {
          // If not in guild, try to fetch as user
          try {
             const user = await client.users.fetch(args[0]);
             targetMember = { user: user, id: user.id };
          } catch (e) {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setDescription('❌ | Could not find a user with that ID!')
              ]
            });
          }
        }
      } 
    }
    
    // If no valid target was found, use the message author
    if (!targetMember) {
      targetMember = message.member;
    }
    
    const supportGuildId = client.config.supportGuildId || "1221909487472869619";
    const guildd = client.guilds.cache.get(supportGuildId);
    let sus = null;
    if (guildd) {
        sus = await guildd.members.fetch(targetMember.id).catch(() => null);
    }
        
    let badges = "";
    if (sus) {
      const roles = [
          { id: "1253763122087591986", emoji: "<:Dev:1475040497666887770>", name: "Developer" },
          { id: "1253763122532061224", emoji: "<:owner:1475040564461178910>", name: "Owner" },
          { id: "1253763107969306694", emoji: "<:Admin:1475040480256327742>", name: "Admin" },
          { id: "1286419579136114784", emoji: "<:Manager:1475040518869094420>", name: "Community Manager" },
          { id: "1260857860909305896", emoji: "<a:premium:1295495411330584778>", name: "Premium User" },
          { id: "1253764016778772583", emoji: "<:moderator:1475040525844217880>", name: "Moderator" },
          { id: "1253763558781616220", emoji: "<:SupportTeam:1475040587492360233>", name: "Support Team" },
          { id: "1253763945391722598", emoji: "<:BugHunter_icone:1475040487843823732>", name: "Bug Hunter" },
          { id: "1268429186314539028", emoji: "<:VIP:1475040599286743073>", name: "VIP" },
          { id: "1295580838360121505", emoji: "<:partnership:1475040569817432212>", name: "Partners" },
          { id: "1253763656336805973", emoji: "<:friend:1475040512439484507>", name: "Owner's Friend" },
          { id: "1269995038457462834", emoji: "<:supporters:1475040585172914197>", name: "Supporter" },
          { id: "1253763836071383111", emoji: "<:users:1475040593930358858>", name: "Bot User" }
      ];
      
      roles.forEach(role => {
          if (sus.roles.cache.has(role.id)) {
              badges += `\n${role.emoji} **${role.name}**`;
          }
      });
    }
    
    const user = targetMember.user || targetMember;
    const usericon = user.displayAvatarURL({ dynamic: true });
    
    try {
        const u = await User.findById(user.id);
        const bio = u && u.bio ? u.bio : `No bio set. Use \`${prefix}bio <bio>\` to set your bio.`;

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true })})
          .setThumbnail(usericon)
          .addFields([
            { name: `**__Bio__**`, value: `${bio}` },
            { name: `**__Server Badges__**`, value: `${badges ? badges : `<:x_cross:1475040602654642176> Oops! Looks Like You Don't Have Any Type Of Badge To Be Displayed! You Can Get One By Joining Our [Support Server](https://discord.gg/w77ymEU82a)`}`}
          ])
          .setColor(client.ankushcolor)
          .setTimestamp();

        message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error in profile command:', error);
        message.channel.send('An error occurred while fetching the profile.');
    }
  }
}