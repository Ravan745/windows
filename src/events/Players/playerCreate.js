const { EmbedBuilder, WebhookClient } = require("discord.js");
const web1 = process.env.PLAYER_LOG_WEBHOOK ? new WebhookClient({ url: process.env.PLAYER_LOG_WEBHOOK }) : null;

module.exports = {
    name: "playerCreate",

    /**
     * @param {Client} client 
     * @param {KazagumoPlayer} player 
     */
    run: async (client, player) => {
        let guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;
        
        let name = guild.name;

        const embed2 = new EmbedBuilder()
            .setColor(client.ankushcolor)
            .setAuthor({ name: `Player Started`, iconURL: client.user.displayAvatarURL() })
            .setDescription(`**Server Name:** ${name}\n**Server Id:** ${player.guildId}`)
            .setTimestamp();
            
        if (web1) web1.send({ embeds: [embed2] }).catch(() => null);

        // Setup SponsorBlock categories to automatically skip non-music segments
        try {
            await player.shoukaku.node.rest.fetch({
                endpoint: `/sessions/${player.shoukaku.node.sessionId}/players/${player.guildId}/sponsorblock/categories`,
                options: {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify([ "sponsor", "selfpromo", "interaction", "intro", "outro", "music_offtopic" ])
                }
            });
            client.logger.log(`SponsorBlock enabled for guild ${player.guildId} on node ${player.shoukaku.node.name}`, "log");
        } catch (error) {
            // Ignore error if the Lavalink node doesn't have SponsorBlock plugin installed
            client.logger.log(`SponsorBlock not supported or failed to enable for guild ${player.guildId}: ${error.message}`, "warn");
        }

        client.logger.log(`Player Create in ${name} [ ${player.guildId} ]`, "log");
    }
};