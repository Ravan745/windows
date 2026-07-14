const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "say",
    category: "Dev",
    aliases: ["broadcast", "speak"],
    description: "Send a message through the bot.",
    args: true,
    usage: "<message>",
    userPerms: [],
    botPerms: ['EmbedLinks'],
    owner: true,
    execute: async (message, args, client, prefix) => {
      const sayMessage = args.join(' ');
      if (!sayMessage) {
        return message.reply("❌ | Please provide a message for the bot to say.");
      }

      await message.delete().catch(() => {});
      return message.channel.send({
        content: sayMessage,
        allowedMentions: { parse: ["users"] }
      });
    },
};
