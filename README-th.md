# บอท Discord จัดการโรสเตอร์กิลด์

[Read in English](README.md)

## ภาพรวม

บอทนี้ช่วยจัดการโปรไฟล์สมาชิกกิลด์และโรสเตอร์กิจกรรมใน Discord รองรับทั้งการสร้างเองและการสร้างอัตโนมัติรายสัปดาห์

## ความสามารถหลัก

- **ลงทะเบียนโปรไฟล์**: `IGN`, `Path`, `Weapon`
- **จัดการโรสเตอร์**: เข้าร่วม, ยกเลิก, ตั้งทีม, แสดงผล, ประกาศ, ลบ
- **ส่งออกข้อมูล**: ปุ่มดาวน์โหลดไฟล์ `.csv` ที่รองรับ Excel
- **ระบบเมนู**: `/menu` สำหรับเมนูส่วนตัว, `/pinmenu` สำหรับโพสต์เมนูสาธารณะในช่อง
- **งานอัตโนมัติรายสัปดาห์**: โพสต์โรสเตอร์วันเสาร์และอาทิตย์อัตโนมัติทุกวันอังคาร และลบโรสเตอร์เก่าอัตโนมัติ
- **ควบคุมรายสัปดาห์ด้วยตัวเอง**: `/triggerweeklybatch` เพื่อสั่งรันงานวันอังคารทันที, `/clearoldroster` เพื่อลบโรสเตอร์อัตโนมัติทั้งหมดในช่อง

## ข้อกำหนด

- Node.js `18.17+`
- Discord application + bot token

## เริ่มใช้งานเร็ว

1. ติดตั้ง dependencies ด้วยคำสั่ง `npm install`
2. สร้างไฟล์ environment ด้วยคำสั่ง `cp .env.example .env`
3. ใส่ค่าตัวแปรที่จำเป็นใน `.env` (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`)
4. รันบอทด้วยคำสั่ง `npm start` (ระบบจะ deploy slash commands อัตโนมัติเมื่อเริ่มทำงาน)

## ตัวแปรแวดล้อม (Environment Variables)

### ตัวแปรหลัก

- `DISCORD_TOKEN`: Bot token
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_GUILD_ID`: Dev guild/server ID (เช่น ไอดีเซิร์ฟเวอร์ Ladpraobro)

### ระบบสร้างโรสเตอร์รายสัปดาห์

- `AUTO_ROSTER_ENABLED`: (เลือกใส่ได้ ค่าเริ่มต้น: `true`)
- `AUTO_ROSTER_CHANNEL_ID`: (จำเป็นสำหรับโหมดอัตโนมัติ)
- `AUTO_ROSTER_GUILD_ID`: (เลือกใส่ได้ ค่าสำรอง: `DISCORD_GUILD_ID`)
- `AUTO_ROSTER_TIMEZONE`: (เลือกใส่ได้ ค่าเริ่มต้น: `Asia/Bangkok`)
- `AUTO_ROSTER_HOUR`: (เลือกใส่ได้ ค่าเริ่มต้น: `19`)
- `AUTO_ROSTER_MINUTE`: (เลือกใส่ได้ ค่าเริ่มต้น: `30`)
- `AUTO_ROSTER_SAT_TITLE`: (เลือกใส่ได้)
- `AUTO_ROSTER_SUN_TITLE`: (เลือกใส่ได้)
- `AUTO_ROSTER_FORCE_EVENT`: (บังคับเลือกวันเพื่อทดสอบ: `sat` หรือ `sun`)

### ปรับตัวเลือกในฟอร์ม

- `PATH_OPTIONS_JSON`: (เลือกใส่ได้)
- `WEAPON_OPTIONS_JSON`: (เลือกใส่ได้)
- `TEAM_OPTIONS_JSON`: (เลือกใส่ได้)

> **ตัวอย่าง:** > `PATH_OPTIONS_JSON=[{"label":"Tank","value":"Tank","description":"Frontline"}]` > `WEAPON_OPTIONS_JSON=[{"label":"Sword","value":"Sword","description":"Balanced melee"}]` > `TEAM_OPTIONS_JSON=[{"label":"Attack Team","value":"attack","description":"Offense"},{"label":"Defense Team","value":"defense","description":"Defense"}]`

## วิธีใช้งาน

- **ฝั่งสมาชิก**: พิมพ์ `/register` เพื่อกรอกโปรไฟล์ กดปุ่มบนข้อความโรสเตอร์เพื่อเข้าร่วมกิจกรรม และใช้ `/myroster` เพื่อดูโปรไฟล์และกิจกรรมที่ลงชื่อไว้
- **ฝั่งแอดมิน (แบบสร้างเอง)**: พิมพ์ `/startroster` ใช้ปุ่มหรือ `/setteam` เพื่อจัดทีม ดาวน์โหลด Excel และใช้ `/announceroster` เพื่อประกาศโรสเตอร์
- **เมนูแอดมิน**: พิมพ์ `/menu` สำหรับเมนูจัดการส่วนตัว หรือ `/pinmenu` เพื่อโพสต์เมนูให้แอดมินคนอื่นกดได้
- **งานอัตโนมัติรายสัปดาห์**: ตั้งค่า `AUTO_ROSTER_CHANNEL_ID` และเปิด `AUTO_ROSTER_ENABLED=true` บอทจะจัดการสร้างโรสเตอร์วันอังคารและลบของเก่าให้เอง

## รายการคำสั่ง

- `/register` - เปิดฟอร์มลงทะเบียน
- `/registerpanel` - (แอดมิน) โพสต์แผงลงทะเบียน
- `/menu` - เมนูส่วนตัว
- `/pinmenu` - (แอดมิน) โพสต์เมนูสาธารณะ
- `/triggerweeklybatch` - (แอดมิน) สั่งสร้างโรสเตอร์รายสัปดาห์ทันที
- `/clearoldroster` - (แอดมิน) ลบโรสเตอร์อัตโนมัติทั้งหมดในช่องเป้าหมาย
- `/startroster` - (แอดมิน) เริ่มโรสเตอร์กิจกรรม
- `/roster` - แสดงรายการโรสเตอร์
- `/showroster` - เลือกดูรายละเอียดโรสเตอร์
- `/announceroster` - (แอดมิน) ประกาศโรสเตอร์สาธารณะ
- `/myroster` - แสดงโปรไฟล์และโรสเตอร์ของฉัน
- `/setteam` - (แอดมิน) กำหนดทีมให้สมาชิก
- `/deleteroster` - (แอดมิน) ลบโรสเตอร์ที่เลือก

## การทดสอบระบบรายสัปดาห์

1. ตั้งค่า `AUTO_ROSTER_ENABLED=true`, `AUTO_ROSTER_CHANNEL_ID=<test_channel_id>`, `AUTO_ROSTER_FORCE_EVENT=sat` และตั้งเวลาล่วงหน้า 1-2 นาที
2. รีสตาร์ทบอทและตรวจสอบว่ามีการสร้างโรสเตอร์ 1 อันตรงตามเวลาโดยไม่มีการสร้างซ้ำ
3. ลบ `AUTO_ROSTER_FORCE_EVENT` ออกหลังทดสอบเสร็จ
4. สำหรับการทดสอบแบบเร็ว ให้รัน `/triggerweeklybatch` ตามด้วย `/clearoldroster`

## วิธีหา Channel ID

1. ใน Discord ไปที่ `User Settings` -> `Advanced` -> เปิด `Developer Mode`
2. คลิกขวาที่ช่องที่ต้องการ -> `Copy Channel ID`
3. นำไปใส่ใน `.env` (เช่น `AUTO_ROSTER_CHANNEL_ID=123456789012345678`)

## การจัดเก็บข้อมูลและโครงสร้างโปรเจกต์

- **ไฟล์ข้อมูล**: `data/store.json` (แยกข้อมูลโปรไฟล์ตามกิลด์)
- **src/index.js**: เริ่มการทำงาน, ล็อกอิน, และเปิดระบบตั้งเวลา
- **src/commands.js**: กำหนดโครงสร้าง slash command
- **src/interactions/**: ตัวจัดการคำสั่ง, ปุ่ม, ฟอร์ม, และเมนูเลือก
- **src/services/**: การนำคำสั่งขึ้นเซิร์ฟเวอร์, สิทธิ์, ซิงค์ข้อความ, งานรายสัปดาห์, การส่งออกข้อมูล
- **src/ui/builders.js**: ตัวสร้าง embeds, modals, และ components
- **src/store.js**: ระบบจัดการไฟล์ JSON
