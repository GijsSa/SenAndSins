import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["senandsins", "sheet", "actor"],
      template: "systems/senandsins/SnS/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}],
      scrollY: [".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  _prepareItems(context){
    const gear = [];
    const attributes = [];
    const defects = [];

    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'attribute') {
        attributes.push(i);
      }
      // Append to spells.
      else if (i.type === 'defect') {
        defects.push(i);
      }
    }

    gear.sort();
    attributes.sort();
    defects.sort();

    context.gear = gear;
    context.charAtrributes = attributes;
    context.charDefects = defects;
  }

  /** @inheritdoc */
  async getData() {
    const context = super.getData();
    this._prepareItems(context);
    context.shorthand = !!game.settings.get("senandsins", "macroShorthand");
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.enrichedBiography = await TextEditor.enrichHTML(this.object.system.biography);
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));
    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }
  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different 
    let cls;
    switch ( button.dataset.action ) {
      case "createItem":
        cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
      case "createAttribute":
        cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.AttributeNew"), type: "attribute"}, {parent: this.actor});
        case "createDefect":
          cls = getDocumentClass("Item");
          return cls.create({name: game.i18n.localize("SIMPLE.DefectNew"), type: "defect"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }
}
