
module.exports = {
    name: "disconnect",
    run: async (client, name, players, moved) => {
        if (moved) return; 
        players.map(player => player.disconnect())
        client.logger.log(`Lavalink ${name}: Disconnected`, "warn");
    }
};