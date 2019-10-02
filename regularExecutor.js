const config = require('./regularExecutorConfig.json');
const executeRules = require('./ruleConfig.json').regularExecutorRules;
const regularHandlers = require('./businessLogics.js').regularHandlers;

var tickCounter = 0;

function validateTickCounter(){
    if (tickCounter >= config.maxTickCounterValue){
        tickCounter = 0;
    }
}

function execute(guilds){
    tickCounter++;
    executeRules.forEach(rule => {
        if(rule.guildId && guilds.get(rule.guildId) && 
        Math.floor(tickCounter * config.interval / rule.interval) > Math.floor((tickCounter - 1) * config.interval / rule.interval)){
            regularHandlers[rule.handler](guilds.get(rule.guildId));
        }
    });
    validateTickCounter();
}

module.exports.run = (guilds) => {
    setInterval(execute, config.interval, guilds);
}