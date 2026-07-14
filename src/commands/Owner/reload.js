const { EmbedBuilder } = require("discord.js");
const { readdirSync } = require("fs");

module.exports = {
    name: "reload",
    category: "Owner",
    aliases: ["rd"],
    description: "Reloads a command",
    args: true,
    usage: "<command name>",
    permission: [],
    owner: true,
    execute: async (message, args, client, prefix) => {
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName) || 
                       client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            return message.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor("#ff0000")
                    .setDescription(`❌ Could not find a command with name or alias \`${commandName}\`.`)] 
            });
        }

        // Find the category by searching through the commands directory
        let category = command.category;
        const commandFolders = readdirSync("./src/commands");
        
        if (!category) {
            // Try to find it if category is missing from command object
            for (const folder of commandFolders) {
                const folderFiles = readdirSync(`./src/commands/${folder}`);
                if (folderFiles.includes(`${command.name}.js`)) {
                    category = folder;
                    break;
                }
            }
        }

        if (!category) {
            return message.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor("#ff0000")
                    .setDescription(`❌ Could not determine category for command \`${command.name}\`.`)] 
            });
        }

        const path = `../../commands/${category}/${command.name}.js`;
        
        try {
            // Clear cache
            delete require.cache[require.resolve(path)];
            
            // Re-require and set
            const newCommand = require(path);
            client.commands.set(newCommand.name, newCommand);
            
            return message.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(client.ankushcolor)
                    .setDescription(`✅ Successfully reloaded command: \`${newCommand.name}\``)] 
            });
        } catch (error) {
            console.error(error);
            return message.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle(`Error reloading \`${commandName}\``)
                    .setDescription(`\`\`\`js\n${error.message}\n\`\`\``)] 
            });
        }
    }
}