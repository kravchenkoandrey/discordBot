"use strict";

const Discord = require('discord.js');
const Client = new Discord.Client();
const loginInfo = require('./loginInfo.json');
const rules = require('./ruleConfig.json').messageProcessRules;
const handlers = require("./businessLogics");
const messageChecker = require('./messageChecker');
const DBSettings = require('./dbSettings');
const regularExecutor = require('./regularExecutor.js');

const MongoClient = require("mongodb").MongoClient; 
const url = "mongodb://localhost:27017/";
const DBClient = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

Client.on('ready', () => {
    console.log(`Logged in as ${Client.user.tag}!`);
    regularExecutor.run(Client.guilds); 
});

Client.on('disconnect', () => {
    console.log(`Logging out as ${Client.user.tag}!`);
    DBClient.close();
    console.log(`Disconnected from database`);
});

Client.on('error', console.error);

Client.on('message', msg => {

    const collection = DBSettings.db.collection("users");

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
    DBSettings.db = mongoClient.db(DBSettings.dbConfig.dbName);
    Client.login(loginInfo.token);
    console.log("Successfully connected to database");
});


