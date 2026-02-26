# Guild Roster Discord Bot

[อ่านภาษาไทย (Read in Thai)](README-th.md)

## Overview

Discord bot for guild profile registration and roster management, with weekly auto-created Guild War roster.

## Features

- Profile registration: `IGN`, `Path`
- Roster actions: join, leave, show, announce, delete
- Join flow with day selection modal: `วันเสาร์`, `วันอาทิตย์`, `ทั้งเสาร์และอาทิตย์`
- Excel-compatible export button (`.csv`)
- Menu split:
  - `/menu` for member actions (ephemeral)
  - `/adminmenu` for admin actions (ephemeral)
  - `/pinmenu` for a public menu message in channel
- Weekly automation:
  - Creates one `Guild War` roster every Tuesday at configured time
  - Removes previous auto-weekly rosters
- Manual weekly controls:
  - `/triggerweeklybatch` to run Tuesday behavior now
  - `/clearoldroster` to clear all auto-weekly rosters (including current week)

## Requirements

- Node.js `18.17+`
- Discord application + bot token

## Quick Start

1. Install dependencies: `npm install`
2. Create env file: `cp .env.example .env`
3. Fill required env values in `.env`:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID` (recommended for dev command deployment)
4. Start bot: `npm start`

## Environment Variables

### Core

- `DISCORD_TOKEN`: bot token
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_GUILD_ID`: target guild ID for guild command deployment

### Weekly Scheduler

- `AUTO_ROSTER_ENABLED`: optional, default `true`
- `AUTO_ROSTER_CHANNEL_ID`: optional static target channel ID (must be paired with `AUTO_ROSTER_GUILD_ID`)
- `AUTO_ROSTER_GUILD_ID`: optional static target guild ID (must be paired with `AUTO_ROSTER_CHANNEL_ID`)
- `AUTO_ROSTER_TIMEZONE`: optional, default `Asia/Bangkok`
- `AUTO_ROSTER_DAY`: optional, default `tue` (`mon|tue|wed|thu|fri|sat|sun`)
- `AUTO_ROSTER_HOUR`: optional, default `19`
- `AUTO_ROSTER_MINUTE`: optional, default `30`
- `AUTO_ROSTER_TITLE`: optional, default `Guild War` (the bot auto-appends that week `วันเสาร์/วันอาทิตย์` dates)
- `AUTO_ROSTER_FORCE_EVENT`: optional test override, value `guildwar`

### Select Option Overrides

- `PATH_OPTIONS_JSON`: optional JSON array
- `TEAM_OPTIONS_JSON`: optional JSON array (logic kept for future use)

Example:

```env
PATH_OPTIONS_JSON=[{"label":"Tank","value":"Tank","description":"Frontline"}]
TEAM_OPTIONS_JSON=[{"label":"Attack Team","value":"attack","description":"Offense"},{"label":"Defense Team","value":"defense","description":"Defense"}]
```

## How To Use

### Member Flow

1. Run `/register` and complete profile.
2. In a roster post, click `ลงทะเบียนกิจกรรม`.
3. Choose participation day in modal: `วันเสาร์`, `วันอาทิตย์`, or `ทั้งเสาร์และอาทิตย์`.
4. Use `/myroster` to view your roster history and selected day per roster.

### Admin Manual Roster Flow

1. Run `/startroster`.
2. Members join using the roster button and select day in modal.
3. Click `ดาวน์โหลด Excel` button to export participant list.
4. Run `/announceroster` to post roster summary publicly.

### Menu Flow

- `/menu`: private member menu
- `/adminmenu`: private admin menu
- `/pinmenu`: post public menu message in current channel

### Weekly Auto Flow

1. Set `AUTO_ROSTER_ENABLED=true`.
2. In each server/channel you want to automate, run `/triggerweeklybatch` once (this registers that guild+channel in the scheduler list).
3. Bot checks schedule continuously.
4. On configured `AUTO_ROSTER_DAY` at configured time, it creates one `Guild War` roster per registered target.
5. Old auto-weekly rosters are removed per target channel.

## Commands

- `/register` - Open registration modal
- `/registerpanel` - (Admin) Post registration panel
- `/menu` - Open private member menu
- `/adminmenu` - (Admin) Open private admin menu
- `/pinmenu` - (Admin) Post public menu in current channel
- `/triggerweeklybatch` - (Admin) Run weekly Guild War batch now
- `/clearoldroster` - (Admin) Clear all auto-weekly rosters in current channel
- `/startroster` - (Admin) Create a new roster post
- `/roster` - Show roster list
- `/showroster` - Pick and show roster details
- `/announceroster` - (Admin) Publicly announce roster
- `/myroster` - Show your profile and joined rosters
- `/deleteroster` - (Admin) Delete selected roster

## Testing Weekly Behavior

### Fast Manual Test

1. Configure `.env`:
   - `AUTO_ROSTER_ENABLED=true`
2. Start bot.
3. Run `/triggerweeklybatch` in the test channel.
4. Verify one `Guild War` roster is created and the channel is added to scheduler list.
5. Run `/clearoldroster` in the same channel to clean test data.

### Scheduled Test

1. Set scheduler values close to current time:
   - `AUTO_ROSTER_DAY=<today_day>`
   - `AUTO_ROSTER_HOUR=<next_hour_or_current_hour>`
   - `AUTO_ROSTER_MINUTE=<next_minute>`
2. (Optional) set `AUTO_ROSTER_FORCE_EVENT=guildwar` for easier trigger window.
3. Restart bot and wait for the target minute.
4. Confirm roster is created once and not duplicated.
5. Remove `AUTO_ROSTER_FORCE_EVENT` after test.

## How to get Channel ID

1. In Discord: `User Settings -> Advanced -> Developer Mode`.
2. Right-click target channel -> `Copy Channel ID`.
3. (Optional static target) put it in `.env`, for example:
   - `AUTO_ROSTER_CHANNEL_ID=123456789012345678`

## Data Storage and Structure

- Data file: `data/store.json`
- `src/index.js`: bootstrap and scheduler start
- `src/commands.js`: slash commands
- `src/interactions/`: command/button/modal/select handlers
- `src/services/`: deploy, permissions, message sync, weekly scheduler, export
- `src/ui/builders.js`: embeds/modals/components
- `src/store.js`: JSON data access
