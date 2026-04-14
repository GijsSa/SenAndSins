import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {DocumentSheet}
 */
export class SimpleActorSettingsSheet extends DocumentSheet {
   static DEFAULT_OPTIONS = {
    classes: ["senandsins", "sheet", "actortype", 'themed', 'theme-light'],
    position: {
      width: 240,
      height: 400
    },
    window: {
      resizable: true,
      title: 'SIMPLE.Character'
    },
    tag: 'form',
    form: {
      submitOnChange: false,
      closeOnSubmit: false
    }
  }

      activateListeners(html) {
        super.activateListeners(html);
    
        // Everything below here is only needed if the sheet is editable
        if ( !this.isEditable ) return;
    
        // Attribute Management
        html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
        html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
        html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));
  
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
        return `${game.i18n.localize("SIMPLE.ActorSettings")}: ${this.object.name}`;
      }

      async getData() {
        const context = super.getData();
        context.shorthand = !!game.settings.get("senandsins", "macroShorthand");
        context.systemData = context.data.system;
        context.dtypes = ATTRIBUTE_TYPES;
        return context;
      }



    




}
