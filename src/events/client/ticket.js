const fs = require("fs");
const path = require("path");
const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require("discord.js");

let ticketCounter = 1;

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        // ✅ قسم التقييم
        if (interaction.isStringSelectMenu() && interaction.customId === "rate-support") {
            const ratingValue = parseInt(interaction.values[0]);
            const user = interaction.user;

            await interaction.reply({
                content: `✅ تم تسجيل تقييمك: ${"⭐".repeat(ratingValue)} (${ratingValue}/5)`,
                ephemeral: true
            });

            const logChannel = client.channels.cache.get("1370035215820390400"); // غيّر ID روم التقييم

            const embed = new EmbedBuilder()
                .setTitle("📝 تقييم جديد")
                .addFields(
                    { name: "المستخدم", value: user.tag, inline: true },
                    { name: "التقييم", value: `${"⭐".repeat(ratingValue)} (${ratingValue}/5)`, inline: true }
                )
                .setTimestamp()
                .setColor("Green");

            await logChannel.send({ embeds: [embed] });
            return;
        }

        // ✅ إنشاء التذكرة
        if (interaction.isStringSelectMenu() && interaction.customId === "ticket-type") {
            const ticketType = interaction.values[0];
            const user = interaction.user;

            const categoryId = "1369851822809940020";
            const supportRoleId = "1369851912693743687";

            const formattedTicketNumber = ticketCounter.toString().padStart(4, '0');
            const channelName = `ticket-${formattedTicketNumber}`;

            const existingChannel = interaction.guild.channels.cache.find(c =>
                c.name.includes(user.id) && c.parentId === categoryId
            );

            if (existingChannel) {
                return interaction.reply({
                    content: `❌ لديك تذكرة مفتوحة مسبقًا: <#${existingChannel.id}>`,
                    ephemeral: true
                });
            }

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

            const ticketEmbed = new EmbedBuilder()
                .setTitle("🎟️ تذكرة جديدة")
                .setDescription(`مرحبًا ${user}, يرجى شرح مشكلتك بالتفصيل.`)
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

            await message.pin();

            await interaction.reply({
                content: `✅ تم إنشاء تذكرتك بنجاح: <#${channel.id}>`,
                ephemeral: true
            });

            ticketCounter++;
        }

        // ✅ إغلاق التذكرة
        if (interaction.isButton() && interaction.customId === "close-ticket") {
            const channel = interaction.channel;
            const user = interaction.user;

            await interaction.reply({
                content: `🔒 يتم الآن إغلاق التذكرة بواسطة ${user}. سيتم الحذف خلال 5 ثوانٍ.`,
                ephemeral: false
            });

            const messages = await channel.messages.fetch({ limit: 100 });
            const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            let logContent = `📄 سجل تذكرة: #${channel.name}\n\n`;

            sortedMessages.forEach(msg => {
                logContent += `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
            });

            const fileName = `${channel.name}.txt`;
            const filePath = path.join(__dirname, "..", "logs", fileName);
            fs.writeFileSync(filePath, logContent);

            const ticketOwner = channel.members.find(m => !m.user.bot);
            const logChannelId = "1370026619246346380"; // غيّره إلى روم اللوق
            const logChannel = interaction.guild.channels.cache.get(logChannelId);

            const embed = new EmbedBuilder()
                .setTitle("📁 تم إغلاق تذكرة")
                .setColor("Red")
                .addFields(
                    { name: "صاحب التذكرة", value: ticketOwner ? ticketOwner.user.tag : "غير معروف", inline: true },
                    { name: "اسم القناة", value: channel.name, inline: true },
                    { name: "عدد الرسائل", value: `${sortedMessages.size}`, inline: true },
                    { name: "أغلقها", value: interaction.user.tag }
                )
                .setTimestamp();

            await logChannel.send({
                content: `🧾 تم حفظ نسخة من التذكرة.`,
                embeds: [embed],
                files: [filePath]
            });

            // ✅ إرسال التقييم
            const rateEmbed = new EmbedBuilder()
                .setTitle("⭐ تقييم تجربتك")
                .setDescription("نشكرك على استخدام نظام التذاكر! يرجى تقييم الخدمة.")
                .setColor("#f1c40f");

            const select = new StringSelectMenuBuilder()
                .setCustomId("rate-support")
                .setPlaceholder("اختر تقييمك")
                .addOptions(
                    { label: "⭐", value: "1" },
                    { label: "⭐⭐", value: "2" },
                    { label: "⭐⭐⭐", value: "3" },
                    { label: "⭐⭐⭐⭐", value: "4" },
                    { label: "⭐⭐⭐⭐⭐", value: "5" }
                );

            const row = new ActionRowBuilder().addComponents(select);

            ticketOwner?.send({
                embeds: [rateEmbed],
                components: [row]
            }).catch(() => {
                console.log("❌ لم يتمكن من إرسال التقييم للمستخدم.");
            });

            setTimeout(() => {
                channel.delete().catch(console.error);
            }, 5000);
        }
    },
};
