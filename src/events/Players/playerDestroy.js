const { EmbedBuilder, WebhookClient } = require("discord.js");
const web1 = process.env.PLAYER_LOG_WEBHOOK ? new WebhookClient({ url: process.env.PLAYER_LOG_WEBHOOK }) : null;

module.exports = {
    name: "playerDestroy",
    run: async (client, player) => {
        let guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;
        
        let name = guild.name;
        
        const embed2 = new EmbedBuilder()
            .setColor(client.ankushcolor)
            .setAuthor({ name: `Player Destroy`, iconURL: client.user.displayAvatarURL() })
            .setDescription(`**Server Name:** ${name}\n**Server Id:** ${player.guildId}`)
            .setTimestamp();
            
        if (web1) web1.send({ embeds: [embed2] }).catch(() => null);
    
        client.logger.log(`Player Destroy in ${name} [ ${player.guildId} ]`, "log");

        // Clean up message
        try {
            const message = player.data.get('message');
            if (message && message.deletable) {
                await message.delete().catch(() => null);
            }
        } catch (e) {
            // Silently fail
        }

        // Clean up autoplay data
        try {
            if (player.data.get("autoplay")) {
                player.data.delete("autoplay");
            }
        } catch (err) {
            client.logger.log(err.stack ? err.stack : err, "error");
        }
    }
};