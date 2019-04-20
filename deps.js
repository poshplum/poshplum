const rollup = require('rollup');
const options = require('./rollup.config.js');

options.forEach(opts => {
  rollup.rollup(opts).then((f) => {
    console.log("------------------ bundle ----------------------")
    // console.log(f.watchFiles);
    // console.log("-----------------------------------")
    f.cache.modules.forEach( module => {
      if (!module.id.match(/node_modules/) ) {
        console.log( module.id, module.dependencies )
      }
    })
  });
});
