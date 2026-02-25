# Guild Roster Discord Bot

English + ไทย documentation

## Overview | ภาพรวม

**EN:** This bot manages guild member profiles and event rosters in Discord, with manual and automatic weekly roster creation.

**TH:** บอทนี้ช่วยจัดการโปรไฟล์สมาชิกกิลด์และโรสเตอร์กิจกรรมใน Discord รองรับทั้งการสร้างเองและการสร้างอัตโนมัติรายสัปดาห์

## Main Features | ความสามารถหลัก

- **Profile registration** (`IGN`, `Path`, `Weapon`)
- **Roster management** (join/leave/set-team/show/announce/delete)
- **Export roster** (Excel-compatible `.csv` download button)
- **Menu system**
  - `/menu` = private menu (only command runner sees it)
  - `/pinmenu` = public menu message in channel
- **Weekly automation**
  - Auto-post both Saturday + Sunday event rosters every Tuesday at configured time
  - Auto-clean old weekly auto rosters
- **Manual weekly controls**
  - `/triggerweeklybatch` = run Tuesday batch now
  - `/clearoldroster` = clear all auto-weekly rosters in target channel (including current week)

## Requirements | ข้อกำหนด

- Node.js `18.17+`
- Discord application + bot token

## Quick Start | เริ่มใช้งานเร็ว

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env
```

3. Fill required env values in `.env`

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID` (optional, recommended for development)

4. Run bot

```bash
npm start
```

On startup, slash commands are deployed automatically.

## Environment Variables | ตัวแปรแวดล้อม

### Core | หลัก

- `DISCORD_TOKEN`: Bot token
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_GUILD_ID`: Dev guild/server ID (optional)

### Weekly Scheduler | ระบบสร้างโรสเตอร์รายสัปดาห์

- `AUTO_ROSTER_ENABLED` (optional, default: `true`)
- `AUTO_ROSTER_CHANNEL_ID` (required for auto mode)
- `AUTO_ROSTER_GUILD_ID` (optional, fallback: `DISCORD_GUILD_ID`)
- `AUTO_ROSTER_TIMEZONE` (optional, default: `Asia/Bangkok`)
- `AUTO_ROSTER_HOUR` (optional, default: `19`)
- `AUTO_ROSTER_MINUTE` (optional, default: `30`)
- `AUTO_ROSTER_SAT_TITLE` (optional)
- `AUTO_ROSTER_SUN_TITLE` (optional)
- `AUTO_ROSTER_FORCE_EVENT` (optional test override: `sat` or `sun`)

### Select Options Override | ปรับตัวเลือกในฟอร์ม

- `PATH_OPTIONS_JSON` (optional)
- `WEAPON_OPTIONS_JSON` (optional)
- `TEAM_OPTIONS_JSON` (optional)

Example:

```env
PATH_OPTIONS_JSON=[{"label":"Tank","value":"Tank","description":"Frontline"}]
WEAPON_OPTIONS_JSON=[{"label":"Sword","value":"Sword","description":"Balanced melee"}]
TEAM_OPTIONS_JSON=[{"label":"Attack Team","value":"attack","description":"Offense"},{"label":"Defense Team","value":"defense","description":"Defense"}]
```

## How To Use | วิธีใช้งาน

### 1) Member flow | ฝั่งสมาชิก

1. Run `/register` and fill profile.
2. Open roster message and click `เข้าร่วมกิจกรรม`.
3. If needed, click `ยกเลิกลงชื่อ`.
4. Use `/myroster` to see your profile + joined events.

### 2) Admin manual roster flow | ฝั่งแอดมินแบบสร้างเอง

1. Run `/startroster` (optional title).
2. Members join from buttons.
3. Use `ตั้งทีม (แอดมิน)` button or `/setteam` to assign teams.
4. Use `ดาวน์โหลด Excel` button to get roster file.
5. Use `/announceroster` to post roster publicly.

### 3) Admin menu flow | เมนูแอดมิน

1. `/menu` for private quick actions.
2. `/pinmenu` to post menu publicly in channel.

### 4) Weekly automation flow | งานอัตโนมัติรายสัปดาห์

1. Set `AUTO_ROSTER_CHANNEL_ID`.
2. Keep `AUTO_ROSTER_ENABLED=true`.
3. Every Tuesday at configured time, bot creates both Saturday + Sunday rosters.
4. Bot removes old auto-weekly rosters from previous weeks during scheduled/trigger runs.

## Command Reference | รายการคำสั่ง

- `/register` - Open registration modal | เปิดฟอร์มลงทะเบียน
- `/registerpanel` (admin) - Post registration panel | โพสต์แผงลงทะเบียน
- `/menu` - Private action menu | เมนูส่วนตัว
- `/pinmenu` (admin) - Post public menu | โพสต์เมนูสาธารณะ
- `/triggerweeklybatch` (admin) - Manually trigger Tuesday batch now | สั่งสร้างโรสเตอร์รายสัปดาห์ทันที
- `/clearoldroster` (admin) - Clear all auto-weekly rosters in target channel | ลบโรสเตอร์อัตโนมัติทั้งหมดในช่องเป้าหมาย
- `/startroster` (admin) - Create roster post | เริ่มโรสเตอร์กิจกรรม
- `/roster` - Show roster list | แสดงรายการโรสเตอร์
- `/showroster` - Pick and show roster details | เลือกดูรายละเอียดโรสเตอร์
- `/announceroster` (admin) - Publicly announce roster | ประกาศโรสเตอร์สาธารณะ
- `/myroster` - Show your profile + rosters | แสดงโปรไฟล์และโรสเตอร์ของฉัน
- `/setteam` (admin) - Assign team by picker | กำหนดทีมให้สมาชิก
- `/deleteroster` (admin) - Delete selected roster | ลบโรสเตอร์ที่เลือก

## Testing Weekly Features | การทดสอบระบบรายสัปดาห์

1. Set:
   - `AUTO_ROSTER_ENABLED=true`
   - `AUTO_ROSTER_CHANNEL_ID=<test_channel_id>`
   - `AUTO_ROSTER_FORCE_EVENT=sat` (or `sun`)
   - `AUTO_ROSTER_HOUR` / `AUTO_ROSTER_MINUTE` to 1-2 minutes ahead
2. Restart bot.
3. Verify one roster is created at scheduled minute.
4. Ensure no duplicate is created in same day.
5. Remove `AUTO_ROSTER_FORCE_EVENT` after test.

Alternative fast test:

- Run `/triggerweeklybatch` to create both events immediately.
- Run `/clearoldroster` to clear all auto-weekly rosters in target channel.

## How to get Channel ID | วิธีหา Channel ID

1. Discord -> `User Settings` -> `Advanced` -> enable `Developer Mode`.
2. Right-click target channel -> `Copy Channel ID`.
3. Put it in `.env`:

```env
AUTO_ROSTER_CHANNEL_ID=123456789012345678
```

## Data Storage | การจัดเก็บข้อมูล

- Data file: `data/store.json`
- Member profiles are scoped by guild.

## Project Structure | โครงสร้างโปรเจกต์

- `src/index.js` - bootstrap + login + scheduler start
- `src/commands.js` - slash command definitions
- `src/interactions/` - command/button/modal/select handlers
- `src/services/` - command deploy, permissions, message sync, weekly scheduler, export
- `src/ui/builders.js` - embeds/modals/components builders
- `src/store.js` - JSON storage layer
