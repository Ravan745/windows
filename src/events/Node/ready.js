const AutoReconnect = require('../../models/autoreconnect');

module.exports = {
    name: "ready",
    run: async (client, name) => {
        try {
            client.logger.log(`Lavalink "${name}" connected.`, "ready");
            client.logger.log("Auto Reconnect Collecting player 24/7 data", "log");

            const maindata = await AutoReconnect.findAll();
            client.logger.log(`Auto Reconnect found ${maindata.length ? `${maindata.length} queue${maindata.length > 1 ? 's' : ''}. Resuming all auto reconnect queue` : '0 queue'}`, "ready");

            for (let data of maindata) {
                const index = maindata.indexOf(data);
                setTimeout(async () => {
                    const channel = client.channels.cache.get(data.TextId);
                    const voice = client.channels.cache.get(data.VoiceId);
                    if (!channel || !voice) return await data.destroy(); // Use destroy instead of delete for Sequelize
                    const player = await client.manager.createPlayer({
                        guildId: data.Guild,
                        voiceId: data.VoiceId,
                        textId: data.TextId,
                        deaf: true,
                    });

                    if (player && data.Queue) {
                        try {
                            const tracks = JSON.parse(data.Queue);
                            for (const savedTrack of tracks) {
                                const res = await player.search(savedTrack.uri, { requester: client.user });
                                if (res && res.tracks && res.tracks[0]) {
                                    player.queue.add(res.tracks[0]);
                                }
                            }
                            if (!player.playing && !player.paused) await player.play();
                        } catch (err) {
                            console.error(`Failed to restore queue for guild ${data.Guild}:`, err);
                        }
                    }
                }, index * 5000);
            }
        } catch (error) {
            console.error('Error handling ready event:', error);
        }
    }
};
