import {ATTRIBUTE_TYPES} from "./constants.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;

export class SimpleItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

    static DEFAULT_OPTIONS = {
      classes: ["senandsins", "sheet", "item", 'themed', 'theme-light'],
      position: {
        width: 520,
        height: 480,
      },
      window: {
        resizable: true,
        title: 'SIMPLE.Items'
      },
      tag: 'form',
      form: {
        handler: SimpleItemSheet.onSubmitForm,
        submitOnChange: true,
        closeOnSubmit: false
      },
      actions:
      {
        editImage: this.onEditImage
      }
  }
  
  static TABS = {
    item: {
        tabs: [
          { id: 'itemDescription', label: 'SIMPLE.Description' },
          { id: 'itemDetails', label: 'SIMPLE.Details' }
        ],
        initial: 'itemDescription' 
      },
    attribute: {
      tabs: [
        { id: 'attributeDescription', label: 'SIMPLE.Description' },
        { id: 'attributeDetails', label: 'SIMPLE.Details' }
      ],
      initial: 'attributeDescription' 
    },
    defect: {
      tabs: [
        { id: 'defectDescription', label: 'SIMPLE.Description' },
        { id: 'defectDetails', label: 'SIMPLE.Details' }
      ],
      initial: 'defectDescription' 
    }
  }

  /** @inheritdoc */
  static PARTS = {
    header: {
        template: "systems/senandsins/SnS/items/item-sheet.html",
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs',
    },
    itemDescription: {
      template: `systems/senandsins/templates/itemParts/item-partial-pc-description.html`
    },
    itemDetails: {
      template: `systems/senandsins/templates/itemParts/item-partial-pc-details.html`
    },
    defectDescription: {
      template: `systems/senandsins/templates/itemParts/defect-partial-pc-description.html`
    },
    defectDetails: {
      template: `systems/senandsins/templates/itemParts/defect-partial-pc-details.html`
    },
    attributeDescription: {
      template: `systems/senandsins/templates/itemParts/attribute-partial-pc-description.html`
    },
    attributeDetails: {
      template: `systems/senandsins/templates/itemParts/attribute-partial-pc-details.html`
    }
  }
  

  get title() {
    return `${this.options.document.name}`;
  }

  get label()
  {
    return `${game.i18n.localize(this.options.window.title)}`;
  }  

  get document() {
    return this.options.document  // Document comes from options
  }

  _configureRenderOptions(options) {
    // This fills in `options.parts` with an array of ALL part keys by default
    // So we need to call `super` first
    super._configureRenderOptions(options);
    // Completely overriding the parts
    options.parts = ['header', 'tabs']
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Keep in mind that the order of `parts` *does* matter
    // So you may need to use array manipulation
    options.parts.push(`${this.document.type}Description`);
    options.parts.push(`${this.document.type}Details`);
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


  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.tabs = this._prepareTabs(`${this.item.type}`)
    context.system = this.item.system;
    context.flags = this.item.flags;  
    context.dtypes = ATTRIBUTE_TYPES;
    context.enrichedDescription = await TextEditor.enrichHTML(this.document.system.description,
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    );
    return context;
  }

  static async onSubmitForm(event, form, formData) {
    event.preventDefault()
    await this.document.update(formData.object) // Note: formData.object
  }

  async _preparePartContext(partId, context) {

    if(partId.includes(`${this.document.type}`))
    {
      context.tab = context.tabs[partId];
    }
    return context;
  }
}
