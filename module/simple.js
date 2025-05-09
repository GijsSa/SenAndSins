/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItem } from "./item.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SimpleActorSheet } from "./actor-sheet.js";
import { SimpleActorRollSheet } from "./actor-roll-sheet.js";
import { SimpleActorSettingsSheet } from "./actor-settings-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { createsenandsinsMacro } from "./macro.js";
import { SimpleToken, SimpleTokenDocument } from "./token.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing SnS System`);

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6",
    decimals: 2
  };

  game.senandsins = {
    SimpleActor,
    createsenandsinsMacro,
    useEntity: foundry.utils.isNewerVersion("9", game.version ?? game.data.version)
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;
  CONFIG.Token.documentClass = SimpleTokenDocument;
  CONFIG.Token.objectClass = SimpleToken;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("senandsins", SimpleActorSheet, { makeDefault: true });
  Actors.registerSheet("senandsins", SimpleActorSettingsSheet, { makeDefault: false });
  Actors.registerSheet("senandsins", SimpleActorRollSheet, { makeDefault: false });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("senandsins", SimpleItemSheet, { makeDefault: true });

  // Register system settings
  game.settings.register("senandsins", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register initiative setting.
  game.settings.register("senandsins", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "2d6+@stats.attackCombatValue.main+@settings.additionalInit.main",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("senandsins", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if ( !isValid ) {
      if ( notify ) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  // Preload template partials
  await preloadHandlebarsTemplates();
});

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => createsenandsinsMacro(data, slot));

/**
 * Adds the actor template context menu.
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {
  const idAttr = game.senandsins.useEntity ? "entityId" : "documentId";
  // Define an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li.data(idAttr));
      return !actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data(idAttr));
      actor.setFlag("senandsins", "isTemplate", true);
    }
  });

  // Undefine an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const actor = game.actors.get(li.data(idAttr));
      return actor.isTemplate;
    },
    callback: li => {
      const actor = game.actors.get(li.data(idAttr));
      actor.setFlag("senandsins", "isTemplate", false);
    }
  });
});

/**
 * Adds the item template context menu.
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {
  const idAttr = game.senandsins.useEntity ? "entityId" : "documentId";
  // Define an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const item = game.items.get(li.data(idAttr));
      return !item.isTemplate;
    },
    callback: li => {
      const item = game.items.get(li.data(idAttr));
      item.setFlag("senandsins", "isTemplate", true);
    }
  });

  // Undefine an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const item = game.items.get(li.data(idAttr));
      return item.isTemplate;
    },
    callback: li => {
      const item = game.items.get(li.data(idAttr));
      item.setFlag("senandsins", "isTemplate", false);
    }
  });
});
