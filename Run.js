"use strict";

const Discord = require('discord.js');
const Client = new Discord.Client();
// const RichEmbed = new Discord.RichEmbed();
const loginInfo = require('./loginInfo.json');
const rules = require('./ruleConfig.json');
const handlers = require("./businessLogics");
const messageChecker = require('./messageChecker');
const DBSettings = require('./dbSettings');

const MongoClient = require("mongodb").MongoClient; 
const url = "mongodb://localhost:27017/";
const DBClient = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

Client.on('ready', () => {
    console.log(`Logged in as ${Client.user.tag}!`); 
});

Client.on('disconnect', () => {
    console.log(`Logging out as ${Client.user.tag}!`);
    DBClient.close();
    console.log(`Disconnected from database`);
});

Client.on('error', console.error);

Client.on('message', msg => {
    // var re = new Discord.RichEmbed()
    // .setTitle("Тест Embed")
    // .setColor(0xff0000)
    // .setDescription("Просто тестирую Embed у бота. Ничего интересного. Проходите, не задерживайтесь");
    // msg.channel.send(re);

    const collection = DBSettings.db.collection("users");
    // collection.find().toArray((err, result) =>
    // {
    //     result.forEach((element, i, arr) => 
    //     {
    //         console.log(`${i}:\n`);
    //         for (var key in element)
    //         {
    //             console.log(`   ${key}: ${element[key]}`)
    //         }
    //     })
    //     console.log(result);
    // });
    if (messageChecker.checkMessageByRule(msg, rules.globalMessageProcessRule)){
        rules.messageProcessRules.forEach(element => {
            if (messageChecker.checkMessageByRule(msg, element.filters)){
                // console.log(element.msgHandler);
                // msg.channel.send(element.msgHandler);
                try {
                    handlers[element.msgHandler](msg);   
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


