const NoPrefixes = require('../../models/noprefix');
const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    run: async (client, oldMember, newMember) => {
        if (!oldMember || !newMember) return;

        const supportGuildId = client.config.supportGuildId || "1221909487472869619";
        if (oldMember.guild.id !== supportGuildId) return;

        const supportGuild = client.guilds.cache.get(supportGuildId);
        if (!supportGuild) return;

        const role = supportGuild.roles.premiumSubscriberRole;
        if (!role) return;

        const hadRoleBefore = oldMember.roles.cache.has(role.id);
        const hasRoleNow = newMember.roles.cache.has(role.id);

        try {
            if (!hadRoleBefore && hasRoleNow) {
                if (!client.noPrefix.has(newMember.id)) {
                    await NoPrefixes.create({ userId: newMember.id }).catch(() => null);
                    client.noPrefix.add(newMember.id);
                    console.log(`✅ Auto NoPrefix added to ${newMember.user.tag} (Boosted)`);
                }
            } else if (hadRoleBefore && !hasRoleNow) {
                await NoPrefixes.destroy({ where: { userId: oldMember.id } }).catch(() => null);
                client.noPrefix.delete(oldMember.id);
                console.log(`❌ Auto NoPrefix removed from ${oldMember.user.tag} (Unboosted)`);
            }
        } catch (error) {
            console.error("Error updating NoPrefix status:", error);
        }
    },
};
