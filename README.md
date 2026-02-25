# Guild Roster Discord Bot

[อ่านภาษาไทย (Read in Thai)](README-th.md)

## Overview

This bot manages guild member profiles and event rosters in Discord, with manual and automatic weekly roster creation.

## Main Features

- **Profile registration**: `IGN`, `Path`, `Weapon`
- **Roster management**: join, leave, set-team, show, announce, delete
- **Export roster**: Excel-compatible `.csv` download button
- **Menu system**: `/menu` for a private menu, `/pinmenu` for a public menu message
- **Weekly automation**: Auto-post Saturday and Sunday event rosters every Tuesday, and auto-clean old weekly rosters
- **Manual weekly controls**: `/triggerweeklybatch` to run the Tuesday batch now, `/clearoldroster` to clear all auto-weekly rosters in the target channel

## Requirements

- Node.js `18.17+`
- Discord application + bot token

## Quick Start

1. Install dependencies using `npm install`
2. Create environment file using `cp .env.example .env`
3. Fill required env values in `.env` (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`)
4. Run bot using `npm start` (Slash commands are deployed automatically on startup)

## Environment Variables

### Core

- `DISCORD_TOKEN`: Bot token
- `DISCORD_CLIENT_ID`: Discord application client ID
- `DISCORD_GUILD_ID`: Dev guild/server ID

### Weekly Scheduler

- `AUTO_ROSTER_ENABLED`: (optional, default: `true`)
- `AUTO_ROSTER_CHANNEL_ID`: (required for auto mode)
- `AUTO_ROSTER_GUILD_ID`: (optional, fallback: `DISCORD_GUILD_ID`)
- `AUTO_ROSTER_TIMEZONE`: (optional, default: `Asia/Bangkok`)
- `AUTO_ROSTER_HOUR`: (optional, default: `19`)
- `AUTO_ROSTER_MINUTE`: (optional, default: `30`)
- `AUTO_ROSTER_SAT_TITLE`: (optional)
- `AUTO_ROSTER_SUN_TITLE`: (optional)
- `AUTO_ROSTER_FORCE_EVENT`: (optional test override: `sat` or `sun`)

### Select Options Override

- `PATH_OPTIONS_JSON`: (optional)
- `WEAPON_OPTIONS_JSON`: (optional)
- `TEAM_OPTIONS_JSON`: (optional)

> **Example:**
> `PATH_OPTIONS_JSON=[{"label":"Tank","value":"Tank","description":"Frontline"}]`
> `WEAPON_OPTIONS_JSON=[{"label":"Sword","value":"Sword","description":"Balanced melee"}]`
> `TEAM_OPTIONS_JSON=[{"label":"Attack Team","value":"attack","description":"Offense"},{"label":"Defense Team","value":"defense","description":"Defense"}]`

## How To Use

- **Member flow**: Run `/register` to fill profile, click buttons on the roster message to join/leave, and use `/myroster` to see your joined events.
- **Admin manual roster flow**: Run `/startroster`, use `/setteam` or buttons to assign teams, export to Excel, and `/announceroster` to post publicly.
- **Admin menu flow**: Use `/menu` for private quick actions or `/pinmenu` to post it publicly.
- **Weekly automation flow**: Set `AUTO_ROSTER_CHANNEL_ID` and keep `AUTO_ROSTER_ENABLED=true`. The bot handles Tuesday creation and old roster cleanup automatically.

## Command Reference

- `/register` - Open registration modal
- `/registerpanel` - (Admin) Post registration panel
- `/menu` - Private action menu
- `/pinmenu` - (Admin) Post public menu
- `/triggerweeklybatch` - (Admin) Manually trigger Tuesday batch now
- `/clearoldroster` - (Admin) Clear all auto-weekly rosters in target channel
- `/startroster` - (Admin) Create roster post
- `/roster` - Show roster list
- `/showroster` - Pick and show roster details
- `/announceroster` - (Admin) Publicly announce roster
- `/myroster` - Show your profile + rosters
- `/setteam` - (Admin) Assign team by picker
- `/deleteroster` - (Admin) Delete selected roster

## Testing Weekly Features

1. Set `AUTO_ROSTER_ENABLED=true`, `AUTO_ROSTER_CHANNEL_ID=<test_channel_id>`, `AUTO_ROSTER_FORCE_EVENT=sat`, and set the time 1-2 minutes ahead.
2. Restart bot and verify one roster is created at the scheduled minute without duplicates.
3. Remove `AUTO_ROSTER_FORCE_EVENT` after testing.
4. For a fast test, run `/triggerweeklybatch` and then `/clearoldroster`.

## How to get Channel ID

1. In Discord, go to `User Settings` -> `Advanced` -> enable `Developer Mode`.
2. Right-click target channel -> `Copy Channel ID`.
3. Put it in `.env` (e.g., `AUTO_ROSTER_CHANNEL_ID=123456789012345678`).

## Data Storage & Project Structure

- **Data file**: `data/store.json` (Member profiles are scoped by guild)
- **src/index.js**: Bootstrap, login, and scheduler start
- **src/commands.js**: Slash command definitions
- **src/interactions/**: Command, button, modal, and select handlers
- **src/services/**: Command deploy, permissions, message sync, weekly scheduler, export
- **src/ui/builders.js**: Embeds, modals, and components builders
- **src/store.js**: JSON storage layer
