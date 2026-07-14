const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const { progressbar } = require('../utils/progressbar');
const { initializeFonts, Bloom } = require('musicard');

module.exports = class EmbedHandler {
    constructor(client) {
        this.client = client;
        this.fontsInitialized = false;
    }

    async build(track, player) {
        try {
            if (!track || !player) {
                return new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('No track or player information available.');
            }

            if (!this.fontsInitialized) {
                await initializeFonts();
                this.fontsInitialized = true;
            }

            const trackTitle = track.title || 'Unknown Title';
            const artistName = track.author || 'Unknown Artist';
            const albumArt = track.thumbnail || `https://img.youtube.com/vi/${track.identifier}/maxresdefault.jpg`;
            const progress = track.isStream ? 100 : Math.min(100, Math.max(0, Math.round((player.shoukaku.position / track.length) * 100)));

            const cardBuffer = await Bloom({
                trackName: trackTitle.length > 30 ? trackTitle.slice(0, 30) + '...' : trackTitle,
                artistName: artistName.length > 30 ? artistName.slice(0, 30) + '...' : artistName,
                albumArt: albumArt,
                isExplicit: false,
                timeAdjust: {
                    timeStart: track.isStream ? '0:00' : this.formatDuration(player.shoukaku.position),
                    timeEnd: track.isStream ? '🔴 LIVE' : this.formatDuration(track.length),
                },
                progressBar: progress,
                volumeBar: player.volume || 100,
            });

            const attachment = new AttachmentBuilder(cardBuffer, { name: 'card.png' });
            
            const volume = player?.volume || 100;
            const requester = track.requester ? `<@${track.requester.id}>` : 'Guest';
            const positionStr = track.isStream ? '🔴 LIVE' : `${this.formatDuration(player.shoukaku.position)} / ${this.formatDuration(track.length)}`;
            const pBar = track.isStream ? '' : `\n${progressbar(player)}`;

            return {
                embeds: [new EmbedBuilder()
                    .setColor(this.client?.ankushcolor || '#ff0000')
                    .setTitle(`🎵 Now Playing`)
                    .setDescription(`**[${track.title}](${track.uri})**\n\n👤 **Artist:** \`${track.author || 'Unknown'}\`\n📥 **Requested By:** ${requester}\n🔊 **Volume:** \`${volume}%\`\n\n🕒 **Progress:** \`[ ${positionStr} ]\`${pBar}`)
                    .setImage('attachment://card.png')
                    .setTimestamp()],
                files: [attachment]
            };
        } catch (error) {
            console.error('Error generating music card, falling back to embed:', error);
            
            // Safe fallback embed
            const volume = player?.volume || 100;
            const requester = track.requester ? `<@${track.requester.id}>` : 'Guest';
            const positionStr = track.isStream ? '🔴 LIVE' : `${this.formatDuration(player.shoukaku.position)} / ${this.formatDuration(track.length)}`;
            const pBar = track.isStream ? '' : `\n${progressbar(player)}`;

            return {
                embeds: [new EmbedBuilder()
                    .setColor(this.client?.ankushcolor || '#ff0000')
                    .setTitle(`🎵 Now Playing`)
                    .setDescription(`**[${track.title}](${track.uri})**\n\n👤 **Artist:** \`${track.author || 'Unknown'}\`\n📥 **Requested By:** ${requester}\n🔊 **Volume:** \`${volume}%\`\n\n🕒 **Progress:** \`[ ${positionStr} ]\`${pBar}`)
                    .setImage(track.thumbnail || `https://img.youtube.com/vi/${track.identifier}/maxresdefault.jpg`)
                    .setTimestamp()]
            };
        }
    }

    async buildqueue1(tracks, result) {
        try {
            if (!tracks || !tracks.length) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('No tracks in queue.')]
                };
            }

            const track = tracks[0];
            return {
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(track.title.length > 25 ? track.title.slice(0, 25) + '...' : track.title)
                    .setDescription('Queue Information')
                    .addFields(
                        { name: 'Artist', value: track.author || 'Unknown', inline: true },
                        { name: 'Track Count', value: tracks.length.toString(), inline: true }
                    )
                    .setThumbnail(`https://img.youtube.com/vi/${track.identifier}/maxresdefault.jpg`)
                    .setTimestamp()]
            };
        } catch (error) {
            console.error(error);
            return {
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('Failed to create queue information embed.')]
            };
        }
    }

    async buildqueue2(tracks, result) {
        try {
            if (!tracks || !result) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('No playlist information available.')]
                };
            }

            return {
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(result.playlistName)
                    .setDescription('Playlist Information')
                    .addFields(
                        { name: 'Total Tracks', value: tracks.length.toString(), inline: true },
                        { name: 'Playlist Type', value: 'Custom Playlist', inline: true }
                    )
                    .setTimestamp()]
            };
        } catch (error) {
            console.error(error);
            return {
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('Failed to create playlist information embed.')]
            };
        }
    }

    async msg1(client, prefix) {
        try {
            if (!client || !client.prefix) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('No prefix information available.')]
                };
            }

            return {
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Bot Prefix')
                    .setDescription(`Current prefix: \`${client.prefix}\``)
                    .setTimestamp()]
            };
        } catch (error) {
            console.error(error);
            return {
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('Failed to create prefix information embed.')]
            };
        }
    }

    async lyrics(client, message) {
        try {
            if (!client || !message || !client.manager) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('Missing required information for lyrics.')]
                };
            }

            const player = client.manager.players.get(message.guild.id);
            if (!player || !player.queue.current) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('No song is currently playing.')]
                };
            }

            const songName = player.queue.current.title || "Unknown";
            const authorName = player.queue.current.author || "Unknown";
            
            const song = encodeURIComponent(songName);
            const author = encodeURIComponent(authorName);
            
            const response = await axios.get(
                `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${song}&q_artist=${author}&apikey=${process.env.MUSIXMATCH_API_KEY}`
            );
            
            const lyrics = response.data.message.body?.lyrics?.lyrics_body || "No lyrics found.";
            
            return {
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`Lyrics for ${songName}`)
                    .setDescription(lyrics)
                    .addFields({ name: 'Artist', value: authorName })
                    .setTimestamp()]
            };
        } catch (error) {
            console.error(error);
            return {
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('Failed to fetch lyrics.')]
            };
        }
    }

    async generateQueueEmbed(page, track, player) {
        try {
            if (!player || !player.queue) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('No queue information available.')]
                };
            }

            const tracksPerPage = 5;
            const start = (page - 1) * tracksPerPage;
            const end = page * tracksPerPage;
            const tracks = player.queue.slice(start, end);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Current Queue')
                .setDescription(`Showing tracks ${start + 1}-${Math.min(end, player.queue.length)} of ${player.queue.length}`);

            tracks.forEach((track, index) => {
                embed.addFields({
                    name: `${start + index + 1}. ${track.title}`,
                    value: `Artist: ${track.author}\nDuration: ${track.isStream ? '🔴 LIVE' : this.formatDuration(track.length)}\nRequested by: ${track.requester.tag}`
                });
            });

            return {
                embeds: [embed.setTimestamp()]
            };
        } catch (error) {
            console.error(error);
            return {
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('Failed to create queue embed.')]
            };
        }
    }

    async nowplaying(player, track) {
        try {
            if (!player || !player.queue || !player.queue.current) {
                return {
                    embeds: [new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('No track is currently playing.')]
                };
            }

            const current = player.queue.current;
            const volume = player?.volume || 100;

            return {
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Now Playing')
                    .setDescription(`[${current.title}](${current.uri})`)
                    .addFields(
                        { name: 'Artist', value: current.author || 'Unknown', inline: true },
                        { name: 'Duration', value: current.isStream ? '🔴 LIVE' : this.formatDuration(current.length), inline: true },
                        { name: 'Requested By', value: current.requester.tag, inline: true },
                        { name: 'Volume', value: `${volume}%`, inline: true },
                        { name: 'Queue Length', value: `${player.queue.length} tracks`, inline: true }
                    )
                    .setThumbnail(current.thumbnail || `https://img.youtube.com/vi/${current.identifier}/maxresdefault.jpg`)
                    .setTimestamp()]
            };
        } catch (error) {
            console.error(error);
            return {
                embeds: [new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('Failed to create now playing embed.')]
            };
        }
    }

    formatDuration(duration) {
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
};
