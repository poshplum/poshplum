const StyleDictionary =
  require("style-dictionary").extend("./tokens.config.js");
const tinycolor = require("tinycolor2");

let colors = {};
let colorProps = {};
let colorChannels = {};


// Init the transfrom for each color theme
setupColors("color");
setupColors("color-dark");

// replace the original color properties with all the new hsl values
StyleDictionary.properties.color = colors;
StyleDictionary.properties.color.channels = colorChannels;

// build our dictionary for all platforms as specified in the config
// this is the equivalent of: style-dictionary build
// when using the CLI
StyleDictionary.buildAllPlatforms();

//warn to rename dark color class from :root to dark-mode manualy
console.log('\n', '\x1b[1;36m', "!!! Please rename",  '\x1b[1;31m', "_tokens_color-dark.scss", '\x1b[1;36m', "tokens",'\x1b[1;31m', ":root class", '\x1b[1;36m', "to dark mode class", '\x1b[0m', '\n', );  //yellow

function setupColors(theme) {
  // Set the original color properties
  colorProps[theme] = Object.entries(StyleDictionary.properties[theme]);

  colors[theme] = {};
  colorChannels[theme] = {};

  for (const [key, prop] of colorProps[theme]) {
    // convert any color into a hsl object
    const hsl = tinycolor(prop.value).toHsl();
    cloneHSL(hsl, key, prop, theme);
  }
}

// add a new color property for the split channels
function cloneHSL(hsl, key, prop, theme) {
  const channels = ["h", "s", "l"];

  //add default color value
  colors[theme][`color-${key}`] = {
    ...prop,
    value: `hsl(var(--color-${key}-h) var(--color-${key}-s) var(--color-${key}-l))`,
    attributes: { category: "color", theme: theme, channel: false },
  };

  //add seperate color props for each channel
  for (const [channel] of channels) {
    const name = `color-${key}-${channel}`;
    let value = hsl[channel];
    value = value.toFixed(2);

    if (channel === "s" || channel === "l") {
      value = asPercent(value) + "%";
    }
    colorChannels[theme][name] = {
      ...prop,
      value: value,
      attributes: { category: "color", theme: theme, channel: true },
    };
  }
}

function asPercent(num) {
  return num * 100;
}
