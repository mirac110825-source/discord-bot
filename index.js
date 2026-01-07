import 'dotenv/config';
import fs from 'fs';
import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from '@discordjs/voice';
import play from 'play-dl';
import './dashboard.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

/* ================= LOG ================= */
const log = (msg) => {
  const ch = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
  if (ch) ch.send(`📄 ${msg}`);
};

/* ================= READY ================= */
client.once('ready', () => {
  console.log('🛡️ Vanguard FULL Bot Aktif');
});

/* ================= AUTO ROLE ================= */
client.on('guildMemberAdd', member => {
  member.roles.add(process.env.AUTO_ROLE_ID);
  log(`Otorol verildi: ${member.user.tag}`);
});

/* ================= TICKET PANEL ================= */
client.on('messageCreate', async msg => {
  if (msg.content === '!ticket-panel') {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Destek Paneli')
      .setDescription('Aşağıdaki butona basarak ticket açabilirsin.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎟️ Ticket Aç')
        .setStyle(ButtonStyle.Primary)
    );

    msg.channel.send({ embeds: [embed], components: [row] });
  }
});

/* ================= BUTTON ================= */
client.on('interactionCreate', async i => {
  if (!i.isButton()) return;

  if (i.customId === 'open_ticket') {
    const ch = await i.guild.channels.create({
      name: `ticket-${i.user.username}`,
      type: ChannelType.GuildText,
      parent: process.env.TICKET_CATEGORY_ID,
      permissionOverwrites: [
        { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: process.env.STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    // Embed + rol etiketleme
    const embed = new EmbedBuilder()
      .setTitle('🎫 Yeni Ticket')
      .setDescription('Bir kullanıcı destek talebi oluşturdu.')
      .setColor('Green');

    ch.send({
      content: `<@&${process.env.STAFF_ROLE_ID}>`,
      embeds: [embed]
    });

    log(`Ticket açıldı: ${i.user.tag}`);
    i.reply({ content: '✅ Ticket açıldı', ephemeral: true });
  }
});

/* ================= TRANSCRIPT ================= */
client.on('messageCreate', async msg => {
  if (msg.content === '!ticket-kapat' && msg.channel.name.startsWith('ticket-')) {
    const messages = await msg.channel.messages.fetch({ limit: 100 });
    let html = messages.map(m => `<p><b>${m.author.tag}:</b> ${m.content}</p>`).join('');
    fs.writeFileSync(`./transcripts/${msg.channel.name}.html`, html);
    log(`Transcript alındı: ${msg.channel.name}`);
    msg.channel.delete();
  }
});

/* ================= ANTI NUKE ================= */
client.on('roleDelete', role => {
  log(`⚠️ Rol silindi: ${role.name}`);
});
client.on('channelDelete', ch => {
  log(`⚠️ Kanal silindi: ${ch.name}`);
});

/* ================= MUSIC ================= */
client.on('messageCreate', async msg => {
  if (!msg.content.startsWith('!play')) return;

  const url = msg.content.split(' ')[1];
  const vc = msg.member.voice.channel;
  if (!vc) return msg.reply('❌ Ses kanalına gir');

  const stream = await play.stream(url);
  const player = createAudioPlayer();
  const resource = createAudioResource(stream.stream, { inputType: stream.type });

  joinVoiceChannel({
    channelId: vc.id,
    guildId: vc.guild.id,
    adapterCreator: vc.guild.voiceAdapterCreator
  }).subscribe(player);

  player.play(resource);
  msg.reply('🎵 Müzik çalıyor');
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
