import {ATTRIBUTE_TYPES} from "./constants.js";
import { SimpleActorSettingsSheet } from "./actor-settings-sheet.js";
import { SimpleActorRollSheet } from "./actor-roll-sheet.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;
const { Items } = foundry.documents.collections;

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
      createDefect: this._onCreateDefect,
      createAttribute: this._onCreateAttribute,
      createItem: this._onCreateItem,
      edit: this._onEdit,
      delete: this._onDelete,
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
          { id: 'general', label: 'SIMPLE.General' },
          { id: 'items', label: 'SIMPLE.Items' },
          { id: 'description', label: 'SIMPLE.Description' },
          { id: 'notes', label: 'SIMPLE.Notes' }
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
      template: 'templates/generic/tab-navigation.hbs',
    },
    general: {
      template: 'systems/senandsins/templates/actorParts/actor-partial-pc-general.html'
    },
    items: {
      template: 'systems/senandsins/templates/actorParts/actor-partial-pc-items.html'
    },
    description: {
      template: 'systems/senandsins/templates/actorParts/actor-partial-pc-description.html'
    }, 
    notes: {
      template: 'systems/senandsins/templates/actorParts/actor-partial-pc-notes.html'
    }
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

    context.enrichedBiography = await TextEditor.implementation.enrichHTML(
    this.document.system.biography,
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    )

    context.enrichedPeopleOI = await TextEditor.implementation.enrichHTML(
    this.document.system.peopleoi,
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    )

    context.enrichedPointOI = await TextEditor.implementation.enrichHTML(
    this.document.system.pointoi,
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    );

    context.enrichedNotes = await TextEditor.implementation.enrichHTML(
    this.document.system.notes,
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    );

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

  static _onDelete(event, button)
  {
    const item = this.actor.items.get(button.name);
    return item.delete();
  }

  static _onEdit(event, button)
  {
    const item = this.actor.items.get(button.name);   
    return item.sheet.render(true);
  }

  static _onCreateItem()
  {
        let cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
  }

  static _onCreateDefect()
  {    
        let cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.DefectNew"), type: "defect"}, {parent: this.actor});
  }
  
  static _onCreateAttribute()
  {    
        let cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.AttributeNew"), type: "attribute"}, {parent: this.actor});
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
