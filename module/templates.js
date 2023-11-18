/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Attribute list partial.
<<<<<<< HEAD
    "systems/senandsins/templates/parts/sheet-attributes.html",
    "systems/senandsins/templates/parts/sheet-groups.html"
=======
    "systems/SenAndSins/SnS/parts/sheet-attributes.html",
    "systems/SenAndSins/SnS/parts/sheet-groups.html"
>>>>>>> f127bd31bff4f5d107ae8b0cfb50de08700e9740
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};