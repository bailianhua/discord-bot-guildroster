# Guild Roster Discord App (Starter)

This bot implements the first 3 features:

1. Members register profile info (`ign`, `path`, `weapon`)
2. Admin starts roster registration post, members join via button
3. Command to show roster

## Requirements

- Node.js 18.17+ (or newer)
- A Discord application + bot token

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Fill `.env`:

- `DISCORD_TOKEN`: Bot token
- `DISCORD_CLIENT_ID`: Application client ID
- `DISCORD_GUILD_ID` (optional, recommended for development): target server ID
- `PATH_OPTIONS_JSON` (optional): override class/path dropdown options
- `WEAPON_OPTIONS_JSON` (optional): override weapon dropdown options
- `TEAM_OPTIONS_JSON` (optional): override set-team dropdown options

Example JSON format (single line in `.env`):

```env
PATH_OPTIONS_JSON=[{"label":"Tank","value":"Tank","description":"Frontline"}]
WEAPON_OPTIONS_JSON=[{"label":"Sword","value":"Sword","description":"Balanced melee"}]
TEAM_OPTIONS_JSON=[{"label":"Attack Team","value":"attack","description":"Offense"},{"label":"Defense Team","value":"defense","description":"Defense"}]
```

## Run

```bash
npm start
```

On start, slash commands are registered automatically.

## Commands

- `/register` (single modal: IGN text input + path/weapon select lists)
- `/registerpanel` (admin only: post a registration card with button)
- `/menu` (post a persistent Components V2 menu card with action buttons)
- `/startroster title:<optional text>` (admin only: Manage Server permission, users join/cancel via buttons, admin can open set-team modal from roster message)
- `/roster` (show list of created rosters as a Components V2 card)
- `/showroster` (ephemeral: pick roster by name, show details as a Components V2 card, include join/cancel buttons, and admin set-team button)
- `/announceroster` (admin only: pick roster and post the full roster detail publicly in channel)
- `/myroster` (show your registered profile and rosters you joined/assigned as a Components V2 card)
- `/setteam` (admin only: pick roster first, then assign team with user picker)
- `/deleteroster` (admin only: opens a picker to choose which roster to delete)

## Data storage

- Persistent data is stored in `data/store.json`.
- Member profiles are scoped per guild.

## Project structure

- `src/index.js`: thin bootstrap (init client, deploy commands, wire events)
- `src/interactions/`: split interaction handlers by type (chat, button, modal, select)
- `src/services/`: command deployment + permission checks + roster message sync/delete
- `src/ui/builders.js`: embeds/modals/components builders
- `src/config/select-options.js`: defaults + `.env`-driven dropdown options
- `src/commands.js`: slash command definitions
- `src/constants.js`: shared custom IDs/constants
