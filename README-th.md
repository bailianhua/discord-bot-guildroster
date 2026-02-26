# บอท Discord จัดการโรสเตอร์กิลด์

[Read in English](README.md)

## ภาพรวม

บอทสำหรับลงทะเบียนโปรไฟล์สมาชิกกิลด์และจัดการโรสเตอร์กิจกรรมใน Discord พร้อมระบบสร้างโรสเตอร์ Guild War อัตโนมัติรายสัปดาห์

## ความสามารถหลัก

- ลงทะเบียนโปรไฟล์: `IGN`, `Path`
- จัดการโรสเตอร์: เข้าร่วม, ยกเลิก, แสดง, ประกาศ, ลบ
- ปุ่มเข้าร่วมกิจกรรมแบบเลือกวันใน Modal: `วันเสาร์`, `วันอาทิตย์`, `ทั้งเสาร์และอาทิตย์`
- ปุ่มดาวน์โหลดไฟล์ที่เปิดใน Excel ได้ (`.csv`)
- แยกเมนูผู้ใช้/แอดมิน:
  - `/menu` สำหรับสมาชิก (เห็นเฉพาะผู้เรียก)
  - `/adminmenu` สำหรับแอดมิน (เห็นเฉพาะผู้เรียก)
  - `/pinmenu` สำหรับโพสต์เมนูสาธารณะในช่อง
- ระบบอัตโนมัติรายสัปดาห์:
  - สร้างกิจกรรม `Guild War` สัปดาห์ละ 1 รายการ ทุกวันอังคารตามเวลาที่ตั้ง
  - ลบโรสเตอร์อัตโนมัติเก่าที่ค้างอยู่
- คำสั่งควบคุมแบบแมนนวล:
  - `/triggerweeklybatch` รันพฤติกรรมวันอังคารทันที
  - `/clearoldroster` ลบโรสเตอร์อัตโนมัติทั้งหมด (รวมสัปดาห์ปัจจุบัน)

## ข้อกำหนด

- Node.js `18.17+`
- Discord application + bot token

## เริ่มใช้งานแบบเร็ว

1. ติดตั้งแพ็กเกจ: `npm install`
2. สร้างไฟล์ env: `cp .env.example .env`
3. ใส่ค่าจำเป็นใน `.env`:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID` (แนะนำสำหรับ dev)
4. เริ่มบอท: `npm start`

## ตัวแปรแวดล้อม

### ตัวแปรหลัก

- `DISCORD_TOKEN`: bot token
- `DISCORD_CLIENT_ID`: client ID ของ Discord application
- `DISCORD_GUILD_ID`: guild ID สำหรับ deploy คำสั่งแบบ guild

### ตัวแปรระบบรายสัปดาห์

- `AUTO_ROSTER_ENABLED`: ไม่บังคับ, ค่าเริ่มต้น `true`
- `AUTO_ROSTER_CHANNEL_ID`: ไม่บังคับ ใช้กำหนดช่องแบบคงที่ (ต้องตั้งคู่กับ `AUTO_ROSTER_GUILD_ID`)
- `AUTO_ROSTER_GUILD_ID`: ไม่บังคับ ใช้กำหนดเซิร์ฟเวอร์แบบคงที่ (ต้องตั้งคู่กับ `AUTO_ROSTER_CHANNEL_ID`)
- `AUTO_ROSTER_TIMEZONE`: ไม่บังคับ, ค่าเริ่มต้น `Asia/Bangkok`
- `AUTO_ROSTER_DAY`: ไม่บังคับ, ค่าเริ่มต้น `tue` (`mon|tue|wed|thu|fri|sat|sun`)
- `AUTO_ROSTER_HOUR`: ไม่บังคับ, ค่าเริ่มต้น `19`
- `AUTO_ROSTER_MINUTE`: ไม่บังคับ, ค่าเริ่มต้น `30`
- `AUTO_ROSTER_TITLE`: ไม่บังคับ, ค่าเริ่มต้น `Guild War` (บอทจะเติมวันที่เสาร์/อาทิตย์ของสัปดาห์นั้นท้ายชื่อให้อัตโนมัติ)
- `AUTO_ROSTER_FORCE_EVENT`: ไม่บังคับ สำหรับทดสอบ, ใช้ค่า `guildwar`

### ปรับตัวเลือกในฟอร์ม

- `PATH_OPTIONS_JSON`: ไม่บังคับ (JSON array)
- `TEAM_OPTIONS_JSON`: ไม่บังคับ (JSON array, เก็บ logic ไว้สำหรับอนาคต)

ตัวอย่าง:

```env
PATH_OPTIONS_JSON=[{"label":"Tank","value":"Tank","description":"Frontline"}]
TEAM_OPTIONS_JSON=[{"label":"Attack Team","value":"attack","description":"Offense"},{"label":"Defense Team","value":"defense","description":"Defense"}]
```

## วิธีใช้งาน

### ฝั่งสมาชิก

1. ใช้ `/register` เพื่อกรอกโปรไฟล์
2. ไปที่โพสต์กิจกรรม แล้วกดปุ่ม `ลงทะเบียนกิจกรรม`
3. เลือกวันเข้าร่วมใน Modal: `วันเสาร์`, `วันอาทิตย์` หรือ `ทั้งเสาร์และอาทิตย์`
4. ใช้ `/myroster` เพื่อดูประวัติการลงชื่อและวันที่เลือกไว้ต่อกิจกรรม

### ฝั่งแอดมิน (สร้างกิจกรรมเอง)

1. ใช้ `/startroster`
2. ให้สมาชิกกดลงทะเบียนผ่านปุ่ม แล้วเลือกวันใน Modal
3. กดปุ่ม `ดาวน์โหลด Excel` เพื่อส่งออกรายชื่อ
4. ใช้ `/announceroster` เพื่อประกาศสรุปโรสเตอร์แบบสาธารณะ

### เมนู

- `/menu`: เมนูสมาชิกแบบส่วนตัว
- `/adminmenu`: เมนูแอดมินแบบส่วนตัว
- `/pinmenu`: โพสต์เมนูสาธารณะในช่องปัจจุบัน

### ระบบอัตโนมัติรายสัปดาห์

1. ตั้ง `AUTO_ROSTER_ENABLED=true`
2. ในแต่ละเซิร์ฟเวอร์/ช่องที่ต้องการใช้งาน ให้รัน `/triggerweeklybatch` อย่างน้อย 1 ครั้ง (เพื่อบันทึก guild+channel เข้ารายการ scheduler)
3. บอทจะเช็กเวลาตาม schedule ต่อเนื่อง
4. ในวันที่กำหนดด้วย `AUTO_ROSTER_DAY` ตามเวลาที่ตั้ง จะสร้าง `Guild War` 1 รายการต่อเป้าหมายที่ถูกบันทึกไว้
5. ระบบจะลบโรสเตอร์อัตโนมัติเก่าของแต่ละช่องให้อัตโนมัติ

## รายการคำสั่ง

- `/register` - เปิดฟอร์มลงทะเบียน
- `/registerpanel` - (แอดมิน) โพสต์แผงลงทะเบียน
- `/menu` - เปิดเมนูสมาชิกแบบส่วนตัว
- `/adminmenu` - (แอดมิน) เปิดเมนูแอดมินแบบส่วนตัว
- `/pinmenu` - (แอดมิน) โพสต์เมนูสาธารณะในช่องปัจจุบัน
- `/triggerweeklybatch` - (แอดมิน) สั่งรัน weekly Guild War ทันที
- `/clearoldroster` - (แอดมิน) ลบโรสเตอร์อัตโนมัติทั้งหมดในช่องปัจจุบัน
- `/startroster` - (แอดมิน) สร้างโพสต์โรสเตอร์ใหม่
- `/roster` - แสดงรายการโรสเตอร์
- `/showroster` - เลือกและดูรายละเอียดโรสเตอร์
- `/announceroster` - (แอดมิน) ประกาศโรสเตอร์แบบสาธารณะ
- `/myroster` - แสดงโปรไฟล์และโรสเตอร์ที่เข้าร่วม
- `/deleteroster` - (แอดมิน) ลบโรสเตอร์ที่เลือก

## วิธีทดสอบระบบรายสัปดาห์

### ทดสอบเร็วแบบแมนนวล

1. ตั้งค่า `.env`:
   - `AUTO_ROSTER_ENABLED=true`
2. เปิดบอท
3. รัน `/triggerweeklybatch` ในช่องทดสอบ
4. ตรวจว่าเกิดโรสเตอร์ `Guild War` 1 รายการ และช่องถูกเพิ่มในรายการ scheduler
5. รัน `/clearoldroster` ในช่องเดียวกันเพื่อล้างข้อมูลทดสอบ

### ทดสอบตามเวลา schedule

1. ตั้งเวลาให้ใกล้เวลาปัจจุบัน:
   - `AUTO_ROSTER_DAY=<วันปัจจุบัน เช่น thu>`
   - `AUTO_ROSTER_HOUR=<ชั่วโมงถัดไปหรือชั่วโมงปัจจุบัน>`
   - `AUTO_ROSTER_MINUTE=<นาทีถัดไป>`
2. (ไม่บังคับ) ตั้ง `AUTO_ROSTER_FORCE_EVENT=guildwar` เพื่อเทสง่ายขึ้น
3. รีสตาร์ทบอท แล้วรอถึงนาทีที่ตั้ง
4. ตรวจว่าเกิดโพสต์เพียงครั้งเดียวและไม่ซ้ำ
5. ลบ `AUTO_ROSTER_FORCE_EVENT` หลังทดสอบ

## วิธีหา Channel ID

1. ใน Discord ไปที่ `User Settings -> Advanced -> เปิด Developer Mode`
2. คลิกขวาที่ช่องเป้าหมาย แล้วเลือก `Copy Channel ID`
3. (ไม่บังคับ กรณีต้องการ static target) นำค่าไปใส่ใน `.env` เช่น:
   - `AUTO_ROSTER_CHANNEL_ID=123456789012345678`

## การเก็บข้อมูลและโครงสร้าง

- ไฟล์ข้อมูล: `data/store.json`
- `src/index.js`: เริ่มระบบและเปิด scheduler
- `src/commands.js`: นิยาม slash commands
- `src/interactions/`: handler ของ command/button/modal/select
- `src/services/`: deploy, permissions, sync message, weekly scheduler, export
- `src/ui/builders.js`: ตัวสร้าง embed/modal/component
- `src/store.js`: ชั้นจัดการข้อมูล JSON
