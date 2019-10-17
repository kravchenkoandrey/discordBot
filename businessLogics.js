const DBSettings = require('./dbSettings');
const Discord = new require("discord.js");

const messageHandlers = new Object();
const regularHandlers = new Object();

module.exports.messageHandlers = messageHandlers;
module.exports.regularHandlers = regularHandlers;

messageHandlers.payPoints =  function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    readAndModifyUserField(user, "points", 0, increasePointsValue);
}

function payXP(userID, guildID){
    var user = {"userID": userID, "guildID": guildID};
    var users = DBSettings.db.collection('users');
    readAndModifyUserField(user, "xp", 0, increaseXPValue);
}

messageHandlers.showPoints = function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    readAndModifyUserField(user, "points", 0, replyWithPointsValue, message);
}

messageHandlers.showXP = function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    readAndModifyUserField(user, "xp", 0, replyWithXPValue, message); 
}

function increaseXPValue(reqResult){
    var users = DBSettings.db.collection('users');
    var user = {"userID": reqResult.userID, "guildID": reqResult.guildID};
    return users.findOneAndUpdate(user, {$set:{"xp":reqResult.xp + 1}});
}

function increasePointsValue(reqResult){
    var users = DBSettings.db.collection('users');
    var user = {"userID": reqResult.userID, "guildID": reqResult.guildID};
    return users.findOneAndUpdate(user, {$set:{"points":reqResult.points + 1}});
}

function replyWithXPValue(reqResult, message){
    var promise = new Promise((resolve, reject) => {
        message.reply(`твой опыт: ${reqResult.xp}`);
        resolve();
    });
    return promise;
}

function replyWithPointsValue(reqResult, message){
    var promise = new Promise((resolve, reject) => {
        message.reply(`твои поинты: ${reqResult.points}`);
        resolve();
    });
    return promise;
}

function readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter){    
//ищет поле "fieldName" пользователя "user" и вызывает колбэк для его обработки с доп. параметром "callbackParameter"
//если пользователь не найден, создаёт нового
//если поле не найдено, инициализирует его у пользователя со значением "initialValue"
    var userIndex = {userID: user.userID, guildID: user.guildID};
    var users = DBSettings.db.collection('users');
    users.findOne(userIndex, (err, result) => { //поиск пользователя
        if(err){
            console.log(err);
        }
        else if (!result){  
        //если не найден пользователь
            users.insertOne(userIndex, (err) => { 
                if (err){
                    if(err.code == 11000){
                        readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter);    
                    }
                    else{
                        console.log(err); 
                    }
                }
                else{
                    readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter);
                }   
            });
        }   
        else{   
        //если пользователь найден
            if(result[fieldName] == undefined){ 
            //если поле не определено
                var updatingField = new Object();
                updatingField[fieldName] = initialValue;
                users.findOneAndUpdate(userIndex, {$set: updatingField}, (err) => { //установить начальное значение поля
                    if (err){
                        console.log(err); 
                    }
                    else{
                        readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter); 
                    }
                })
            }
            else{   
            //если поле определено
                users.findOne(userIndex, (err, result) => {
                    if (err){
                        console.log(err); 
                    }
                    else{
                        callback(result, callbackParameter).catch((err) => {    
                        //модифицировать поле
                            console.log(`readAndModifyUserField: Error executing callback "${callback}":\n${err}`);
                            if(err.code == 11000){
                                readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter);    
                            }
                        });    
                    }
                })
            }
        }
    }) 
}

messageHandlers.writeEmbed = function(message){
    var embed = new Discord.RichEmbed();
    var params = new Array();
    var startPoint = message.content.indexOf(" ");
    var remaining = message.content;
    for (var i = 0; i < 3; i++){
        var remaining = remaining.slice(startPoint+1);
        var endPoint = remaining.indexOf("/");
        if (endPoint < 0){
            endPoint = undefined;
        }
        params[i] = remaining.slice(0, endPoint);
        startPoint = endPoint;
    }
    if (params[0]){
        embed.setTitle(params[0]);
    }
    if (params[1]){
        if (params[1].startsWith("#")){
            params[1] = "0x" + params[1].slice(1);
        }
        try{
            embed.setColor(Number(params[1]));
        }
        catch{
            console.log("Unable to convert the color parameter to a number")
        }
    }
    if (params[2]){
        embed.setDescription(params[2]);
    }
    console.log(params);
    if (message.attachments){
        var atArray = message.attachments.array();
        for (var i = 0; i < atArray.length; i++){
            if (atArray[i].width){
                embed.setThumbnail(atArray[i].url);
                break;
            }
        }
    }
    message.channel.send(embed);
}

messageHandlers.writeDeleteEmbed = function(message){
    messageHandlers.writeEmbed(message);
    message.delete();
}

regularHandlers.checkVoiceChannelsForMembers = function(guild){
    var users = DBSettings.db.collection('users');
    voiceChannelsArray = guild.channels.filter((channel) =>{
        return channel.type == "voice" && channel.id != guild.afkChannelID;
    }).array();
    for (var i = 0; i < voiceChannelsArray.length; i++){
        voiceChannelsArray[i].members.forEach((member, i, array) => {
            payXP(member.id, guild.id);
        })
    }
}