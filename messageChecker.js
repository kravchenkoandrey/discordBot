var checkMsgByRuleElement = function(message, key, value){
    switch (key){
        case "authorIDs":    //ID автора сообщения соответствует одному из значений массива authorIDs
            result = false;
            value.forEach(element => {
                if (message.author.id == element){
                    result = true;
                    return;
                }
            })
            return result;
        case "excludedAuthors":    //ID автора сообщения не соответствует ни одному из значений массива excludedAuthors
            result = true;
            value.forEach(element => {
                if(message.author.id == element){
                    result = false;
                    return;
                }; 
            }); 
            return result;
        case "contentCS":   //Текст сообщения соответствует значению поля contentCS (с учетом регистра)
            return message.content == value;    
        case "contentCI":   //Текст сообщения соответствует значению поля contentCI (без учета регистра)
            return message.content.toLowerCase() == value.toLowerCase();
        case "substringCS":   //Текст сообщения содержит в себе подстроку, соответствующую 
                            // значению поля substringCS (с учетом регистра)
            return message.content.includes(value); 
        case "substringCI":   //Текст сообщения содержит в себе подстроку, соответствующую 
                            // значению поля substringCI (без учёта регистра)
            return message.content.toLowerCase().includes(value.toLowerCase());   
        case "mentionedUsersOr":    //В сообщении упомянут хотя бы один пользователь с ID из массива, 
                                    // содержещегося в поле mentionedUsersOr
            result = false;
            value.forEach(element => {
                if (message.mentions.users.has(element)){
                    result = true;
                    return;
                }    
            });
            return result;
        case "mentionedUsersAnd":   //В сообщении упомянуты все пользователи с ID из массива, 
                                    // содержещегося в поле mentionedUsersAnd
            result = true;
            value.forEach(element => {
                if (!message.mentions.users.has(element)){
                    result = false;
                    return;
                }    
            });
            return result;
        case "mentionedUsersOnly":  //В сообщении упомянут только кто-то из пользователей с ID из массива, 
                                    // содержещегося в поле mentionedUsersOnly
            if(message.mentions.users.size > 0){
                result = true;
                message.mentions.users.forEach((v, key) => {
                    if (!value.includes(key)){
                        result = false;
                        return;
                    }    
                });
            }
            else{
                result = false;
            }
            return result;
        case "beginSubstringCI":  //В начале текста сообщения содержится подстрока, соответствующая 
                                  // значению поля beginSubstringCI (без учёта регистра) 
            if (message.content.startsWith(value)){
                return true
            }
            else{
                return false
            };
        case "beginSubstringCS":  //В начале текста сообщения содержится подстрока, соответствующая 
                                  // значению поля beginSubstringCS (с учётом регистра)
            if (message.content.toLowerCase().startsWith(value.toLowerCase())){
                return true
            }
            else{
                return false
            };
        default:
            console.log("Элемент правила " + key + " не обрабатывается")
            return false;
    }
}

module.exports.checkMessageByRule = function(message, rule){
    result = true;
    for (key in rule){
        if (!checkMsgByRuleElement(message, key, rule[key])){
            result = false;
            break;
        }
    }
    return result;
}