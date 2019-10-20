
const images = require('./images');

main();

async function main() {
  try {
    await images.optimizeImages();
  } catch(e) {
    console.log(e);
  }
}
