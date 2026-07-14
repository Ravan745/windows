const { EmbedBuilder } = require("discord.js");
const Premium = require("../../models/premium");

module.exports = {
    name: 'karaoke',
    category: 'Filters',
    aliases: ['vocal', 'vocalfree'],
    cooldown: 5,
    description: 'Toggle karaoke/vocal-isolation filter for the current song',
    args: false,
    usage: '',
    userPrams: [],
    botPrams: ['EmbedLinks'],
    owner: false,
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (message, args, client, prefix) => {
        const player = client.manager.players.get(message.guild.id);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(client.ankushcolor)
                .setAuthor({
                    name: message.author.username || "Unknown User",
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`No song/s currently playing within this guild.`)
                .setTimestamp();
            
            return message.channel.send({ embeds: [embed] });
        }

        // Premium check for Karaoke
        const isPremium = await Premium.findOne({ where: { id: message.guild.id } });
        if (!isPremium) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('👑 | **Karaoke vocal isolation filter** is a premium-only filter! Please upgrade this server to premium to unlock.');
            return message.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setColor(client.ankushcolor)
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        if (player.karaoke) {
            player.setKaraoke(false);
            embed.setDescription('🎤 Karaoke Filter (Vocal Isolation) has been: `Disabled`');
        } else {
            player.setKaraoke(true);
            embed.setDescription('🎤 Karaoke Filter (Vocal Isolation) has been: `Enabled`');
        }

        return message.reply({ embeds: [embed] });
    }
};
