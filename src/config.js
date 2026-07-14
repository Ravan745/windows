
module.exports = {
  token: process.env.DISCORD_TOKEN || '', // your discord bot token
  clientId: process.env.CLIENT_ID || "",
  prefix: process.env.PREFIX || '!!', // bot prefix
  ownerID: (process.env.OWNER_IDS || '').split(','), //your discord id
  SpotifyID: process.env.SPOTIFY_ID || 'e6f84fbec2b44a77bf35a20c5ffa54b8', // spotify client id
  SpotifySecret: process.env.SPOTIFY_SECRET || '498f461b962443cfaf9539c610e2ea81', // spotify client secret
  ankushcolor: '#ff0000', // embed colour
  bugReportChannel: "", // ID of the channel where bug reports will be sent
  embedColor: '#ff0000', // Using your existing ankushcolor
  supportServer: "https://discord.com/invite/w77ymEU82a", // Your support server link
  supportGuildId: "1221909487472869619", // Your support guild ID

nodes: [
  {
    url: `lavalink.jirayu.net:13592`,
    name: `Jirayu`,
    auth: `youshallnotpass`,
    secure: false
  },
  {
    url: `lavalinkv4.serenetia.com:80`,
    name: `Serenetia_Tapao`,
    auth: `https://seretia.link/discord`,
    secure: false
  },
  {
    url: `sg1-nodelink.nyxbot.app:3000`,
    name: `NyxBot_SG1`,
    auth: `nyxbot.app/support`,
    secure: false
  },
  {
    url: `sg2-nodelink.nyxbot.app:3000`,
    name: `NyxBot_SG2`,
    auth: `nyxbot.app/support`,
    secure: false
  },
  {
    url: `lava.g3v.co.uk:9008`,
    name: `G3V`,
    auth: `lavalinklol`,
    secure: false
  },
  {
    url: `lavalink.triniumhost.com:4333`,
    name: `Trinium_4333`,
    auth: `free`,
    secure: false
  },
  {
    url: `lavalink.triniumhost.com:2333`,
    name: `Trinium_2333`,
    auth: `kirito`,
    secure: false
  },
  {
    url: `lavalink.triniumhost.com:9008`,
    name: `Trinium_9008`,
    auth: `free`,
    secure: false
  },
  {
    url: `lavalink.triniumhost.com:6000`,
    name: `Kartik`,
    auth: `trinium`,
    secure: false
  },
  {
    url: `lava2.kasawa.pro:2334`,
    name: `MineCuta_Lava2`,
    auth: `youshallnotpass`,
    secure: false
  },
  {
    url: `lavav4.minecuta.com:2333`,
    name: `East112`,
    auth: `discord.gg/gKuXdHs`,
    secure: false
  },
  {
    url: `157.254.192.15:2333`,
    name: `Unknown_Host`,
    auth: `youshallnotpass`,
    secure: false
}

  ],

}

