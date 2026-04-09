import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {DocumentSheet}
 */
export class SimpleActorRollSheet extends DocumentSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["senandsins", "actor-type"],
            template: "systems/senandsins/SnS/Actor extras/actor-roll-sheet.html",
            width: 400,
            height: 250,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

      activateListeners(html) {
        super.activateListeners(html);
    
        // Everything below here is only needed if the sheet is editable
        if ( !this.isEditable ) return;
    
        // Attribute Management
        html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
        html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
        html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

        html.find(".sen-button").click(this._onCheckRoll.bind(this));
  
        // Add draggable for Macro creation
        html.find(".attributes a.attribute-roll").each((i, a) => {
          a.setAttribute("draggable", true);
          a.addEventListener("dragstart", ev => {
            let dragData = ev.currentTarget.dataset;
            ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
          }, false);
        });
      }
      
      get title() {
        return `${game.i18n.localize("SIMPLE.RollTitle")}: ${this.object.name}`;
      }

      async getData() {
        const context = super.getData();
        context.shorthand = !!game.settings.get("senandsins", "macroShorthand");
        context.systemData = context.data.system;
        context.dtypes = ATTRIBUTE_TYPES;
        return context;
      }

      async _onCheckRoll(event) {
        let button = $(event.currentTarget);
        let r = new Roll(this._rollBuilder(button.data('roll')), this.object.getRollData());
        return r.toMessage({
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
                return statRoll + this.object.system.body.main;
            case "Mind":
                return statRoll + this.object.system.mind.main;
            case "Soul":
                return statRoll + this.object.system.soul.main;
            case "ACV":
                return statRoll + this.object.system.stats.attackCombatValue.main;
            case "DCV":
                return statRoll + this.object.system.stats.defenceCombatValue.main;
            
        }
        return statRoll;
       }
}
