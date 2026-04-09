import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
import { SimpleActorSettingsSheet } from "./actor-settings-sheet.js";
import { SimpleActorRollSheet } from "./actor-roll-sheet.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const {ActorSheetV2} =foundry.applications.sheets;
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["senandsins", "sheet", "actor", 'themed', 'theme-light'],
    position: {
      width: 600,
      height: 820
    },
    window: {
      resizable: true,
      title: 'SIMPLE.Character'
    },
    tag: 'form',
    form: {
      handler: SimpleActorSheet.onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions:
    {
      controlItemBind: this._onItemControl,
      createDefect: this._onItemControl,
      createAttribute: this._onItemControl,
      createItem: this._onItemControl,
      edit: this._onItemControl,
      delete: this._onItemControl,
      settingsControl: this._onSettingsControl,
      rollControl: this._onRollControl,
      editImage: this.onEditImage
    }
  }

  get title() {
    return `${this.options.document.name}`;
  }

  get label()
  {
    return `${game.i18n.localize(this.options.window.title)}`;
  }


  static TABS = {
    primary: {
        tabs: [
          { id: 'general', group: 'sheet', label: 'SIMPLE.General' },
          { id: 'items', group: 'sheet', label: 'SIMPLE.Items' },
          { id: 'description', group: 'sheet', label: 'SIMPLE.Description' },
          { id: 'notes', group: 'sheet', label: 'SIMPLE.Notes' }
        ],
        initial: 'general'
      }
  }

  /** @inheritdoc */
  static PARTS = {
    header: {
        template: "systems/senandsins/SnS/actor-sheet.html",
    },
    tabs: {
      template: 'systems/senandsins/templates/parts/actor-partial-pc-tabs.html',
    },
    general: {
      template: 'systems/senandsins/templates/parts/actor-partial-pc-general.html'
    },
    items: {
      template: 'systems/senandsins/templates/parts/actor-partial-pc-items.html'
    },
    description: {
      template: 'systems/senandsins/templates/parts/actor-partial-pc-description.html'
    }, 
    notes: {
      template: 'systems/senandsins/templates/parts/actor-partial-pc-notes.html'
    }, 
  }

  static async onEditImage(event, target) {
    const field = target.dataset.field || "img"
    const current = foundry.utils.getProperty(this.document, field)

    const fp = new foundry.applications.apps.FilePicker({
      type: "image",
      current: current,
      callback: (path) => this.document.update({ [field]: path })
    })

    fp.render(true)
  }

  static async onSubmitForm(event, form, formData) {
    event.preventDefault()
    await this.document.update(formData.object) // Note: formData.object
  }

  /** @override */
  _processFormData(event, form, formData) {
    // Extract the raw form data object BEFORE validation strips out items
    const expanded = foundry.utils.expandObject(formData.object)

    // Handle items separately if they exist
    if (expanded.items) {
      // Store for later processing
      this._pendingItemUpdates = Object.entries(expanded.items).map(([id, itemData]) => ({
        _id: id,
        ...itemData
      }))

      // Remove from the expanded object
      delete expanded.items

      // Flatten and replace the existing formData.object properties
      const flattened = foundry.utils.flattenObject(expanded)

      // Clear existing object and repopulate (since we can't reassign)
      for (const key in formData.object) {
        delete formData.object[key]
      }
      Object.assign(formData.object, flattened)
    }

    // Call parent with modified formData
    return super._processFormData(event, form, formData)
  }

  /** @override */
  async _processSubmitData(event, form, formData) {
    // Process the actor data normally
    const result = await super._processSubmitData(event, form, formData)

    // Now handle any pending item updates
    if (this._pendingItemUpdates?.length > 0) {
      await this.document.updateEmbeddedDocuments('Item', this._pendingItemUpdates)
      delete this._pendingItemUpdates // Clean up
    }

    return result
  }

  get document() {
    return this.options.document  // Document comes from options
  }

  _prepareItems(context){
    const gear = [];
    const attributes = [];
    const defects = [];

    for (let i of context.document.items) {
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

    gear.sort(this.compare);
    attributes.sort(this.compare);
    defects.sort(this.compare);

    context.gear = gear;
    context.charAtrributes = attributes;
    context.charDefects = defects;
  }

  compare( a, b ) {
    if ( a.name < b.name ){
      return -1;
    }
    if ( a.name > b.name ){
      return 1;
    }
    return 0;
  }

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    this._prepareItems(context);
    context.tabs = this._prepareTabs("primary")
    context.system = this.actor.system
    context.flags = this.actor.flags  
    context.shorthand = !!game.settings.get("senandsins", "macroShorthand");
    context.dtypes = ATTRIBUTE_TYPES;
    context.enrichedBiography = await TextEditor.enrichHTML(this.options.document.system.biography);
    context.enrichedPeopleOI = await TextEditor.enrichHTML(this.options.document.system.peopleoi);
    context.enrichedPointOI = await TextEditor.enrichHTML(this.options.document.system.pointoi);
    context.enrichedNotes = await TextEditor.enrichHTML(this.options.document.system.notes);
    return context;
  }

  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'general':
      case 'items':
      case 'description':
      case 'notes':
        context.tab = context.tabs[partId];
        break;
      default:
    }
    return context;
  }

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  static _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different 
    let cls;
    switch ( event ) {
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

  static _onSettingsControl(event){
    event.preventDefault();

    let settingSheet = new SimpleActorSettingsSheet(this.actor);
    settingSheet?.render(true);
  }

  static _onRollControl(event){
    event.preventDefault();

    let rollSheet = new SimpleActorRollSheet(this.actor);
    rollSheet?.render(true);

  }
}
