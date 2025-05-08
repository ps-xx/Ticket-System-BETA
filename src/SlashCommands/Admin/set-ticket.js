const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Client,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    PermissionFlagsBits
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("set-ticket")
      .setDescription("📨 أرسل قائمة لاختيار نوع التذكرة")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
      try {
        const embed = new EmbedBuilder()
          .setTitle("🎫 نظام التذاكر")
          .setDescription("يرجى اختيار نوع المشكلة من القائمة أدناه.\nسوف يتم إنشاء تذكرة خاصة بك تلقائيًا.")
          .setColor("#2b2d31")
          .setFooter({ text: `Ticket System • ${interaction.guild.name}` });
  
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticket-type")
          .setPlaceholder("اختر نوع التذكرة")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("💬 دعم فني")
              .setValue("support"),
            new StringSelectMenuOptionBuilder()
              .setLabel("🛠️ مشكلة في البوت")
              .setValue("bot-issue"),
            new StringSelectMenuOptionBuilder()
              .setLabel("❗ تبليغ عن عضو")
              .setValue("report-member"),
            new StringSelectMenuOptionBuilder()
              .setLabel("📢 اقتراح")
              .setValue("suggestion")
          );
  
        const row = new ActionRowBuilder().addComponents(selectMenu);
  
        await interaction.reply({ content: "✅ تم إرسال قائمة التذاكر.", ephemeral: true });
  
        await interaction.channel.send({
          embeds: [embed],
          components: [row]
        });
  
      } catch (error) {
        console.error("Error in /set-ticket:", error);
        await interaction.reply({ content: "حدث خطأ أثناء إرسال رسالة التذاكر.", ephemeral: true });
      }
    }
  };
  