var inhale = require('../')
  , serveStatic = require('serve-static');

inhale()
  .use('/badjs', inhale.badjs())
  .use('/components', serveStatic('./src/components'))
  .use('/js', inhale.dwarf('./src/js'))
  .use(inhale.inline('./src'))
  .listen(3000);