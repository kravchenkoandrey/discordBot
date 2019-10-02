const DBSettings = require('./dbSettings');
const Discord = new require("discord.js");

const messageHandlers = new Object();
const regularHandlers = new Object();

module.exports.messageHandlers = messageHandlers;
module.exports.regularHandlers = regularHandlers;

messageHandlers.payPointsForMessage =  function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    var users = DBSettings.db.collection('users');
    users.findOne(user, (err, result)=>{
        if (result){
            users.findOneAndUpdate(user, {$set:{"points":result.points+1}})
        }
        else{
            users.insertOne(user);
            users.findOneAndUpdate(user, {$set:{"points": 0}});
        }
    })
}

messageHandlers.showPoints =  function(message){
    var userID = message.author.id;
    var guildID = message.guild.id;
    var user = {"userID": userID, "guildID": guildID};
    var users = DBSettings.db.collection('users');
    users.findOne(user, (err, result)=>{
        if (result){
            message.reply(`твои поинты: ${result.points}`)
        }
        else{
            users.insertOne(user);
            users.findOneAndUpdate(user, {$set:{"points": 0}});
        }
    })
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

regularHandlers.checkVoiseChannelsForUsers = function(guild){
    var count = 0;
    voiceChannelsArray = guild.channels.filter((channel) =>{
        return channel.type == "voice" && channel.id != guild.afkChannelID;
    }).array();
    for (var i = 0; i < voiceChannelsArray.length; i++){
        // console.log(voiceChannelsArray[i].members.size);
        count += voiceChannelsArray[i].members.size;
    }
    console.log(count);
}