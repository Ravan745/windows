const Prefix = require('./models/prefix');
const NoPrefix = require('./models/noprefix');
const DJSettings = require('./models/dj');
const { initializeDatabase } = require('./database');
const MusicBot = require("./structures/MusicClient");
const client = new MusicBot();

module.exports = client;

async function loadPrefixes(client) {
  const prefixes = await Prefix.findAll();
  prefixes.forEach(p => client.prefixes.set(p.id, p.prefix));
}

async function loadNoPrefix(client) {
  const noPrefixData = await NoPrefix.findAll();
  noPrefixData.forEach(p => client.noPrefix.add(p.userId));
}

async function initializeBot() {
  await initializeDatabase();
  await loadPrefixes(client);
  await loadNoPrefix(client);
  client._loadPlayer();
  client._loadClientEvents();
  client._loadNodeEvents();
  client._loadPlayerEvents();
  client._loadCommands();
  client._loadSlashCommands();
  client.connect();
}

initializeBot();

process.on('unhandledRejection', (reason, p) => { console.log(reason, p); });
process.on('uncaughtException', (err, origin) => { console.log(err, origin); });
