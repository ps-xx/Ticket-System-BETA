const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

let ticketCounter = 1; // متغير لتتبع الرقم التسلسلي للتذاكر

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "ticket-type") {
                const ticketType = interaction.values[0];
                const user = interaction.user;

                const categoryId = "1369851822809940020"; // 🛑 غيّره إلى ID القسم المناسب
                const supportRoleId = "1369851912693743687"; // 🛑 غيّره إلى ID الرول اللي يتابع التذاكر

                // تنسيق الرقم التسلسلي ليظهر بصيغة 0001, 0002, ...
                const formattedTicketNumber = ticketCounter.toString().padStart(4, '0');

                const channelName = `ticket-${formattedTicketNumber}`.toLowerCase().replace(/ /g, "-");

                const existingChannel = interaction.guild.channels.cache.find(c =>
                    c.name.includes(user.id) && c.parentId === categoryId
                );

                if (existingChannel) {
                    return interaction.reply({
                        content: `❌ لديك تذكرة مفتوحة مسبقًا: <#${existingChannel.id}>`,
                        ephemeral: true
                    });
                }

                // إنشاء القناة
                const channel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        },
                        {
                            id: supportRoleId,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        }
                    ],
                });

                // إرسال رسالة في التذكرة
                const ticketEmbed = new EmbedBuilder()
                    .setTitle("🎟️ تذكرة جديدة")
                    .setDescription(`مرحبًا ${user}, يرجى شرح مشكلتك بالتفصيل. سيتم الرد عليك قريبًا من قبل الفريق.`)
                    .addFields({ name: "نوع التذكرة", value: `\`${ticketType}\``, inline: true })
                    .setColor("#2ecc71");

                const closeButton = new ButtonBuilder()
                    .setCustomId("close-ticket")
                    .setLabel("🗑️ إغلاق التذكرة")
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(closeButton);

                const message = await channel.send({
                    content: `${user} | <@&${supportRoleId}>`,
                    embeds: [ticketEmbed],
                    components: [row]
                });

                // Pin الرسالة التي تحتوي على الـ Embed
                await message.pin();

                // إرسال رسالة تأكيد للمستخدم
                await interaction.reply({
                    content: `✅ تم إنشاء تذكرتك بنجاح: <#${channel.id}>. سيتم الرد عليك قريبًا!`,
                    ephemeral: true
                });

                // زيادة الرقم التسلسلي بعد إنشاء التذكرة
                ticketCounter++;
            }
        }

        // زر إغلاق التذكرة
        if (interaction.isButton() && interaction.customId === "close-ticket") {
            const channel = interaction.channel;
            const user = interaction.user;

            await interaction.reply({
                content: `🔒 سيتم إغلاق التذكرة خلال 5 ثوانٍ بواسطة ${user}.`,
                ephemeral: false
            });

            setTimeout(() => {
                channel.delete().catch(console.error);
            }, 5000);
        }
    },
};
