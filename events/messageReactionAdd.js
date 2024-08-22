import { Events } from 'discord.js';

export default {
    name: Events.MessageReactionAdd,
    once: false,
    async execute(reaction, user, client) {
        try {if (reaction.partial) {await reaction.fetch()};if (user.partial) {await user.fetch()};} catch (error) {console.error(error);return;}
        if (reaction.emoji.id === '1252511924147589164' && reaction.message.id === '1252527623054037066') {
            const guild = reaction.message.guild;
            const role = guild.roles.cache.get('1252957893397844038');
            const member = guild.members.cache.get(user.id);
            if (role && member) {await member.roles.add(role)};
        }
    },
};