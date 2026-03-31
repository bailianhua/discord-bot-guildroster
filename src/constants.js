const REGISTER_BUTTON_ID = "open_register_modal";

const MENU_BUTTONS = {
  register: "menu_register",
  myRoster: "menu_myroster",
  rosterList: "menu_roster_list",
  startRoster: "menu_start_roster",
  showRoster: "menu_show_roster",
  announceRoster: "menu_announce_roster",
  manageProfileOptions: "menu_manage_profile_options",
  calendar: "menu_calendar",
  deleteRoster: "menu_delete_roster",
  triggerWeeklyBatch: "menu_trigger_weekly_batch",
  clearOldRoster: "menu_clear_old_roster"
};

const PROFILE_OPTION_ACTIONS = {
  addRole: "profileopt_add_role",
  addWeapon: "profileopt_add_weapon",
  deleteRole: "profileopt_delete_role",
  deleteWeapon: "profileopt_delete_weapon",
  refresh: "profileopt_refresh",
  addRoleModal: "profileopt_add_modal_role",
  addWeaponModal: "profileopt_add_modal_weapon",
  deleteRoleSelect: "profileopt_delete_select_role",
  deleteWeaponSelect: "profileopt_delete_select_weapon"
};

module.exports = {
  REGISTER_BUTTON_ID,
  MENU_BUTTONS,
  PROFILE_OPTION_ACTIONS
};
