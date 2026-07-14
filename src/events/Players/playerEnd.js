const { autoplay } = require('../../utils/functions');

module.exports = {
	name: "playerEnd",
	run: async (client, player) => {
		try {
			const prevMessage = player.data.get("message");
			if (prevMessage && prevMessage.deletable) {
				await prevMessage.delete().catch(() => null);
			}
		} catch (e) {
			// Silently fail
		}
		
		let guild = client.guilds.cache.get(player.guildId);
		if (!guild) return;

		// Check if autoplay is enabled
		const autoplayEnabled = player.data.get("autoplay");
		
		if (autoplayEnabled && player.queue.size === 0) {
			try {
				console.log("🎵 Autoplay is enabled, searching for related songs...");
				const result = await autoplay(player, client);
				
				if (!result) {
					console.log("⚠️ Autoplay could not find songs");
				}
			} catch (error) {
				console.error("❌ Autoplay failed:", error);
				
				const channel = guild.channels.cache.get(player.textId);
				if (channel) {
					const { EmbedBuilder } = require('discord.js');
					const embed = new EmbedBuilder()
						.setColor("#ff0000")
						.setDescription("❌ Autoplay encountered an error. Trying to recover...")
						.setTimestamp();
					
					channel.send({ embeds: [embed] }).then(msg => {
						setTimeout(() => msg.delete().catch(() => null), 5000);
					}).catch(() => null);
				}
			}
		}
	}
};