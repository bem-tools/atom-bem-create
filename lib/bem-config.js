do {
    var config = require('bem-config')(); if(!config) break;
    var bemToolsConf = config.moduleSync('bem-tools'); if (!bemToolsConf) break;
    var bemCreateConf = bemToolsConf.plugins['create']; if (!bemCreateConf) break;
    console.log('config', config, bemToolsConf, bemCreateConf);
} while (false)

module.exports = {
    common: config,             // Common bem configs
    specific: bemCreateConf,    // Plugin specific configs
};
