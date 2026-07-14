const { Client, Message, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { oops } = require("../../utils/functions.js");

module.exports = {
    name: "setupSystem",

    /**
     * 
     * @param {Client} client 
     * @param {Message} message 
     */
    run: async (client, message) => {
        if (!message.member.voice.channel) {
            await oops(message.channel, `You are not connected to a voice channel to queue songs.`, client.ankushcolor);
            if (message) await message.delete().catch(() => {});
            return;
        }

        if (!message.member.voice.channel.permissionsFor(client.user).has([PermissionFlagsBits.Speak, PermissionFlagsBits.Connect])) {
            await oops(message.channel, `I don't have enough permission to connect/speak in ${message.member.voice.channel}`);
            if (message) await message.delete().catch(() => {});
            return;
        }

        if (message.guild.members.me.voice.channel && message.guild.members.me.voice.channelId !== message.member.voice.channelId) {
            await oops(message.channel, `You are not connected to <#${message.guild.members.me.voice.channelId}> to queue songs`);
            if (message) await message.delete().catch(() => {});
            return;
        }

        let player = client.manager.players.get(message.guildId);
        
        if (!player) {
            player = await client.manager.createPlayer({
                guildId: message.guild.id,
                voiceId: message.member.voice.channel.id,
                textId: message.channel.id,
                deaf: true,
            });
        }

        try {
            const query = message.content;
            const res = await player.search(query, { requester: message.author });
            
            if (!res || !res.tracks || !res.tracks.length) {
                await oops(message.channel, `No results found for your query.`, client.ankushcolor);
            } else {
                if (res.type === 'PLAYLIST') {
                    for (const track of res.tracks) {
                        player.queue.add(track);
                    }
                    const playlistName = res.playlist && res.playlist.name ? res.playlist.name : "Unknown Playlist";
                    const embed = new EmbedBuilder()
                        .setColor(client.ankushcolor || '#FF0000')
                        .setDescription(`Loaded playlist **${playlistName}** with ${res.tracks.length} track(s).`);
                    await message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
                } else {
                    const track = res.tracks[0];
                    player.queue.add(track);
                    const embed = new EmbedBuilder()
                        .setColor(client.ankushcolor || '#FF0000')
                        .setDescription(`Added **[${track.title}](${track.uri})** to queue.`);
                    await message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
                }
                
                if (!player.playing && !player.paused) {
                    await player.play();
                }
            }
        } catch (error) {
            console.error("Error in setupSystem track load:", error);
            await oops(message.channel, `An error occurred while loading the track.`, client.ankushcolor);
        }

        if (message) await message.delete().catch(() => {});
    }
}
