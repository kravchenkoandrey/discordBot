//Код, запускающий всю логику
"use strict";

const Discord = require('discord.js');
const loginInfo = require('./loginInfo.json');
const rules = require('./ruleConfig.json').messageProcessRules;
const handlers = require("./businessLogics");
const messageChecker = require('./messageChecker');
const globalSettings = require('./globalSettings');
const regularExecutor = require('./regularExecutor.js');

const MongoClient = require("mongodb").MongoClient; 
const url = "mongodb://localhost:27017/";
const DBClient = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

globalSettings.client = new Discord.Client();

globalSettings.client.on('ready', () => {
    console.log(`Logged in as ${globalSettings.client.user.tag}!`);
    regularExecutor.run(globalSettings.client.guilds); 
});

globalSettings.client.on('disconnect', () => {
    console.log(`Logging out as ${globalSettings.client.user.tag}!`);
    DBClient.close();
    console.log(`Disconnected from database`);
});

globalSettings.client.on('error', console.error);

globalSettings.client.on('message', msg => {

    const collection = globalSettings.db.collection("users");

    if (messageChecker.checkMessageByRule(msg, rules.globalMessageProcessRule)){
        rules.localMessageProcessRules.forEach(element => {
            if (messageChecker.checkMessageByRule(msg, element.filters)){
                try {
                    handlers.messageHandlers[element.msgHandler](msg);   
                } catch (error) {
                    console.log(error);  
                    console.log(`Handler: ${handlers.msgHandler}`);      
                }
            }
        })
    }
});


DBClient.connect((err, mongoClient) => 
{
    globalSettings.db = mongoClient.db(globalSettings.dbConfig.dbName);
    globalSettings.client.login(loginInfo.token);
    console.log("Successfully connected to database");
});


