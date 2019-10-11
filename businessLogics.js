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
    var users = DBSettings.db.collection('users');
    users.findOne(user, (err, result) => {
        if(err){
            console.log(err);
        }
        else if (!result){
            users.insertOne(user, (err, result) => {
                if(err){
                    if(err.code == 11000){
                        messageHandlers.payPoints(message);    
                    }
                    else{
                        console.log(err); 
                    }
                }
                else{
                    messageHandlers.payPoints(message);
                }    
            });
        }
        else{
            if (result.points == undefined){
                users.findOneAndUpdate(user, {$set:{"points": 0}}, (err) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        messageHandlers.payPoints(message); 
                    }   
                });                
            }
            else{
                users.findOneAndUpdate(user, {$set:{"points":result.points+1}}, (err) => {
                    if(err){
                        console.log(err);
                    }
                })
            }
        }
    })
}

function payXP(userID, guildID){
    // console.log("payXP executed");
    var user = {"userID": userID, "guildID": guildID};
    var users = DBSettings.db.collection('users');
    users.findOne(user, (err, result) => {
        if(err){
            console.log(err);
        }
        else if (!result){
            console.log("No result");
            users.insertOne(user, (err, result) => {
                if(err){
                    if(err.code == 11000){
                        payXP(userID, guildID);    
                    }
                    else{
                        console.log(err); 
                    }
                }
                else{
                    payXP(userID, guildID);
                }    
            });
        }
        else{
            if (result.xp == undefined){
                console.log("No xp");
                users.findOneAndUpdate(user, {$set:{"xp": 0}}, (err) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        payXP(userID, guildID); 
                    }   
                });                
            }
            else{
                users.findOneAndUpdate(user, {$set:{"xp":result.xp+1}}, (err) => {
                    if(err){
                        console.log(err);
                    }
                })
            }
        }
    })
}

messageHandlers.showPoints = function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    readAndModifyUserField(user, "points", 0, replyWithPointsValue, message);
}

function replyWithPointsValue(reqResult, message){
    message.reply(`твои поинты: ${reqResult.points}`);
}

messageHandlers.writeEmbed = function(message){
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
    var embed = new Discord.RichEmbed();
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
            console.log("Unable to convert color parameter to number")
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

function readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter){
    var userIndex = {userID: user.userID, guildID: user.guildID};
    var users = DBSettings.db.collection('users');
    users.findOne(userIndex, (err, result) => {
        if(err){
            console.log(err);
        }
        else if (!result){
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
            if(result[fieldName] == undefined){
                var updatingField = new Object();
                updatingField[fieldName] = initialValue;
                users.findOneAndUpdate(userIndex, {$set: updatingField}, (err) => {
                    if (err){
                        console.log(err); 
                    }
                    else{
                        readAndModifyUserField(user, fieldName, initialValue, callback, callbackParameter);
                    }
                })
            }
            else{
                users.findOne(userIndex, (err, result) => {
                    if (err){
                        console.log(err); 
                    }
                    else{
                        callback(result, callbackParameter);
                    }
                })
            }
        }
    }) 
}

function replyWithXPValue(reqResult, message){
    message.reply(`твой опыт: ${reqResult.xp}`)
}

messageHandlers.showXP = function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    readAndModifyUserField(user, "xp", 0, replyWithXPValue, message); 
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