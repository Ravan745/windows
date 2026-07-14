const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { convertTime } = require("./convert");

/**
 * 
 * @param {TextChannel} channel 
 * @param {String} args 
 */
async function oops(channel, args, client) {
    try {
        let embed1 = new EmbedBuilder().setColor("#ff0000").setDescription(`${args}`);

        const m = await channel.send({
            embeds: [embed1]
        });

        setTimeout(async () => await m.delete().catch(() => { }), 12000);
    } catch (e) {
        return console.error(e)
    }
};

/**
 * Function to handle button replies
 * @param {Message} message - The message object
 * @param {String} content - The content to reply with
 * @param {Array} buttons - Array of button objects
 */
async function buttonReply(message, content, buttons = []) {
    try {
        const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setDescription(content);

        const row = new ActionRowBuilder();
        
        buttons.forEach(button => {
            const btn = new ButtonBuilder()
                .setCustomId(button.customId || 'default')
                .setLabel(button.label || 'Button')
                .setStyle(button.style || ButtonStyle.Primary);
            
            if (button.emoji) btn.setEmoji(button.emoji);
            if (button.disabled) btn.setDisabled(button.disabled);
            
            row.addComponents(btn);
        });

        const components = buttons.length > 0 ? [row] : [];

        return await message.reply({
            embeds: [embed],
            components: components
        });
    } catch (error) {
        console.error('Error in buttonReply:', error);
        return null;
    }
}

/**
 * 
 * @param {KazagumoPlayer} player 
 * @param {Client} client
 * @returns 
 */
async function autoplay(player, client) {
    try {
        const MAX_HISTORY = 15;
        const ARTIST_COOLDOWN = 3;
        
        const track = player.data.get("autoplaySystem");
        let requester = player.data.get("requester");
        let history = player.data.get("playHistory") || [];
        let artistCooldown = player.data.get("artistCooldown") || {};
        
        if (!track) {
            console.log("No autoplay system data found");
            return;
        }

        if (!requester) {
            console.log("No requester found, using default");
            requester = client.user;
        }

        const searchQueries = [
            `similar to ${track.author} - ${track.title}`,
            `artist radio ${track.author}`,
            `songs like ${track.title} by ${track.author}`,
            `${track.author} mix`,
            `${track.author} popular`,
        ];

        for (const query of searchQueries) {
            try {
                console.log(`Autoplay searching: ${query}`);
                
                let res = await player.search(query, { requester: requester });

                if (res && res.tracks && res.tracks.length > 0) {
                    const filteredTracks = res.tracks.filter(t => {
                        const currentTitle = track.title.toLowerCase();
                        const currentAuthor = track.author.toLowerCase();
                        const testTitle = t.title.toLowerCase();
                        const testAuthor = t.author.toLowerCase();
                        
                        const isInHistory = history.some(h => 
                            h.title.toLowerCase() === testTitle && 
                            h.author.toLowerCase() === testAuthor
                        );
                        
                        return (
                            testTitle !== currentTitle &&
                            !testTitle.includes('live') &&
                            !testTitle.includes('cover') &&
                            !testTitle.includes('reaction') &&
                            !isInHistory &&
                            (artistCooldown[testAuthor] || 0) < ARTIST_COOLDOWN
                        );
                    });

                    if (filteredTracks.length > 0) {
                        const randomIndex = Math.floor(Math.random() * Math.min(filteredTracks.length, 3));
                        const selectedTrack = filteredTracks[randomIndex];

                        player.queue.add(selectedTrack);

                        player.data.set("autoplaySystem", {
                            title: selectedTrack.title,
                            author: selectedTrack.author,
                            requester: requester
                        });

                        history.unshift({
                            title: selectedTrack.title,
                            author: selectedTrack.author
                        });
                        if (history.length > MAX_HISTORY) history.pop();
                        player.data.set("playHistory", history);

                        Object.keys(artistCooldown).forEach(artist => {
                            artistCooldown[artist] = Math.min((artistCooldown[artist] || 0) + 1, ARTIST_COOLDOWN);
                        });
                        artistCooldown[selectedTrack.author.toLowerCase()] = 0;
                        player.data.set("artistCooldown", artistCooldown);

                        if (!player.playing && !player.paused) {
                            player.play();
                        }

                        console.log(`✅ Autoplay added: ${selectedTrack.title} by ${selectedTrack.author}`);
                        return true;
                    }
                }
            } catch (searchError) {
                console.error(`❌ Search failed for query: ${query}`, searchError.message);
                continue;
            }
        }

        console.log("⚠️ Autoplay: No suitable tracks found after all searches");
        return false;
        
    } catch (error) {
        console.error("❌ Autoplay error:", error);
        return false;
    }
}

const AutoReconnect = require('../models/autoreconnect');

async function savePlayerSession(player) {
    try {
        const is247 = await AutoReconnect.findOne({ where: { Guild: player.guildId } });
        if (is247) {
            const tracks = [];
            if (player.queue.current) {
                tracks.push({
                    title: player.queue.current.title,
                    uri: player.queue.current.uri,
                    author: player.queue.current.author,
                    length: player.queue.current.length
                });
            }
            player.queue.forEach(track => {
                tracks.push({
                    title: track.title,
                    uri: track.uri,
                    author: track.author,
                    length: track.length
                });
            });

            await is247.update({
                Queue: JSON.stringify(tracks)
            });
        }
    } catch (e) {
        console.error("Failed to save player session:", e);
    }
}

module.exports = {
    buttonReply,
    oops,
    autoplay,
    savePlayerSession
};
