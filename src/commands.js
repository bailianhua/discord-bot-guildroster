// To this:
const { PermissionFlagsBits } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const commands = [
  new SlashCommandBuilder()
    .setName("register")
    .setDescription("เปิดหน้าต่างลงทะเบียนโปรไฟล์"),
  new SlashCommandBuilder()
    .setName("registerpanel")
    .setDescription("โพสต์การ์ดลงทะเบียนพร้อมปุ่มกด")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("เปิดเมนูคำสั่งแบบกดปุ่ม (เห็นเฉพาะคุณ)"),
  new SlashCommandBuilder()
    .setName("adminmenu")
    .setDescription("เปิดเมนูแอดมินแบบกดปุ่ม (เห็นเฉพาะคุณ)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("pinmenu")
    .setDescription("โพสต์เมนูแบบสาธารณะในช่องนี้")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("triggerweeklybatch")
    .setDescription("สั่งสร้างโรสเตอร์ Guild War ประจำสัปดาห์ทันที")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("clearoldroster")
    .setDescription("ลบโรสเตอร์อัตโนมัติทั้งหมดในช่องเป้าหมาย")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("startroster")
    .setDescription("เริ่มโพสต์ลงชื่อกิจกรรม (Roster)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("roster")
    .setDescription("แสดงรายการกิจกรรมที่เคยสร้าง"),
  new SlashCommandBuilder()
    .setName("showroster")
    .setDescription("เลือกชื่อกิจกรรมเพื่อดูรายละเอียด"),
  new SlashCommandBuilder()
    .setName("calendar")
    .setDescription("แสดงปฏิทินจาก roster ที่มีวันที่")
    .addStringOption((option) =>
      option
        .setName("message_id")
        .setDescription("ระบุ message id ของ roster ที่ต้องการดู (ไม่บังคับ)")
        .setRequired(false)
        .setMaxLength(30)
    ),
  new SlashCommandBuilder()
    .setName("announceroster")
    .setDescription("เลือกกิจกรรมแล้วประกาศรายละเอียดแบบสาธารณะในช่อง")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("myroster")
    .setDescription("แสดงข้อมูลการลงทะเบียนและกิจกรรมของฉัน"),
  new SlashCommandBuilder()
    .setName("setteam")
    .setDescription("เลือกกิจกรรมแล้วกำหนดทีมให้สมาชิก")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("deleteroster")
    .setDescription("ลบกิจกรรมเก่าออกจากระบบ")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map((command) => command.toJSON());

module.exports = { commands };
