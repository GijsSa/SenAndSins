import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {DocumentSheet}
 */
export class SimpleActorRollSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
   static DEFAULT_OPTIONS = {
    classes: ["senandsins", "sheet", "actor", 'themed', 'theme-light'],
    position: {
      width: 400,
      height: 250
    },
    window: {
      resizable: true,
      title: 'SIMPLE.Character'
    },
    tag: 'form',
    form: {
      submitOnChange: false,
      closeOnSubmit: true
    },
    actions:
    {
      rollControl: this._onCheckRoll
    }
  }

  get title() {
    return `Roll: ${this.options.document.name}`;
  }
  
  get document() {
    return this.options.document  // Document comes from options
  }

  get label()
  {
    return `${game.i18n.localize(this.options.window.title)}`;
  }

  static PARTS = {
    header: {
        template: "systems/senandsins/SnS/actor extras/actor-roll-sheet.html",
    }
  }

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.shorthand = !!game.settings.get("senandsins", "macroShorthand");
    context.system = this.actor.system
    context.dtypes = ATTRIBUTE_TYPES;
    return context;
  }

  static _onCheckRoll(event, button) {
    let roll = new Roll(this._rollBuilder(button.dataset.roll));
    return roll.toMessage({
      user: game.user.id,
      content: String(this.total),
      sound: CONFIG.sounds.dice
    });
  }

  _rollBuilder(rollData){
      let completeRoll = rollData;
      let bonus =  document.getElementsByName("rollBonus");
      completeRoll += this.getStatBonus();
      if(bonus[0].value != ""){
          completeRoll += " + " + bonus[0].value;
      }
      return completeRoll;
  }

  getStatBonus(){
    let statRoll = " + ";

    let list = document.getElementsByName("rollStats");
    switch(list[0].value){
        case "NS":
            return "";
        case "Body":
            return statRoll + this.document.system.body.main;
        case "Mind":
            return statRoll + this.document.system.mind.main;
        case "Soul":
            return statRoll + this.document.system.soul.main;
        case "ACV":
            return statRoll + this.document.system.stats.attackCombatValue.main;
        case "DCV":
            return statRoll + this.document.system.stats.defenceCombatValue.main;
        
    }
    return statRoll;
  }
}
