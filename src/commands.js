const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");

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
    .setDescription("โพสต์เมนูคำสั่งแบบกดปุ่มไว้ในแชท"),
  new SlashCommandBuilder()
    .setName("startroster")
    .setDescription("เริ่มโพสต์ลงชื่อกิจกรรม (Roster)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("หัวข้อกิจกรรม")
        .setRequired(false)
        .setMaxLength(80)
    ),
  new SlashCommandBuilder()
    .setName("roster")
    .setDescription("แสดงรายการกิจกรรมที่เคยสร้าง"),
  new SlashCommandBuilder()
    .setName("showroster")
    .setDescription("เลือกชื่อกิจกรรมเพื่อดูรายละเอียด"),
  new SlashCommandBuilder()
    .setName("announceroster")
    .setDescription("เลือกกิจกรรมแล้วประกาศรายละเอียดแบบสาธารณะในช่อง")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("myroster")
    .setDescription("แสดงข้อมูลการลงทะเบียนและกิจกรรมของฉัน"),
  new SlashCommandBuilder()
    .setName("setteam")
    .setDescription("เลือกกิจกรรมแล้วกำหนดทีมโจมตี/ป้องกันให้สมาชิก")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("deleteroster")
    .setDescription("ลบกิจกรรมเก่าออกจากระบบ")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map((command) => command.toJSON());

module.exports = { commands };
