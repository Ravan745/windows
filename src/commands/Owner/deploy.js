const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'deploy',
  category: 'Owner',
  aliases: ['registerslash', 'deploycommands'],
  cooldown: 5,
  description: 'Deploys/registers all loaded slash commands onto Discord\'s global registry.',
  args: false,
  usage: '',
  userPrams: [],
  botPrams: ['EmbedLinks'],
  owner: true,
  execute: async (message, args, client, prefix) => {
    try {
      const deployMessage = await message.reply("⚡ | Initiating global slash commands registration on Discord... Please wait.");

      const data = [];
      client.slashCommands.forEach(cmd => {
        data.push(cmd);
      });

      await client.application.commands.set(data);

      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle("⚡ Slash Commands Deployed")
        .setDescription(`Successfully registered and deployed **${data.length}** slash commands globally to Discord's registry!`)
        .setFooter({ text: "Note: Global command updates may take a few minutes to cache and reflect in all servers." })
        .setTimestamp();

      return deployMessage.edit({ content: null, embeds: [successEmbed] });
    } catch (error) {
      console.error('Error deploying slash commands:', error);
      return message.reply(`❌ | Failed to deploy slash commands: \`${error.message}\``);
    }
  }
};
