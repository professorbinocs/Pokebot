const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix, city) => {

  // DECLARE VARIABLES
  let nickname = '';

  // GET USER NICKNAME
  if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }

  let requestAction = new Discord.RichEmbed().setColor('00ff00')
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('What would you like to do with your Pokémon Subscriptions?')
    .setFooter('You can \'view\', \'add\', \'remove\', \'edit\', \'pause\' or \'resume\'.');

  message.channel.send(requestAction).catch(console.error).then( msg => {

    // DEFINED VARIABLES
    let input = '';

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id==message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 60000 });

    // FILTER COLLECT EVENT
    collector.on('collect', message => {
      switch(message.content.toLowerCase()){
        case 'add': collector.stop('add'); break;
        case 'remove': collector.stop('remove'); break;
        case 'edit': collector.stop('edit'); break;
        case 'view': collector.stop('view'); break;
        case 'pause': collector.stop('pause'); break;
        case 'resume': collector.stop('resume'); break;
        default:
          message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete(5000)).catch(console.error);
      }
    });

    // COLLECTOR HAS BEEN ENDED
    collector.on('end', (collected,reason) => {

      // DELETE ORIGINAL MESSAGE
      msg.delete();
      switch(reason){
        case 'add':
          subscription_create(MAIN, message, nickname, prefix); break;
        case 'remove':
          subscription_remove(MAIN, message, nickname, prefix); break;
        case 'edit':
          subscription_modify(MAIN, message, nickname, prefix); break;
        case 'view':
          subscription_view(MAIN, message, nickname, prefix); break;
        case 'resume':
        case 'pause':
          subscription_status(MAIN, message, nickname, reason, prefix); break;
        default:
          console.log(reason)
          return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error);
      }
    });
  });
}





// PAUSE OR RESUME POKEMON SUBSCRIPTIOONS
function subscription_status(MAIN, message, nickname, reason, prefix){
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
    if(user[0].pokemon_paused == 'ACTIVE' && reason == 'resume'){
      return message.reply('Your Pokémon subsctipions are already `ACTIVE`.').then(m => m.delete(5000)).catch(console.error);
    }
    else if(user[0].pokemon_paused == 'PAUSED' && reason == 'pause'){
      return message.reply('You Pokémon subsctipions are already `PAUSED`.').then(m => m.delete(5000)).catch(console.error);
    }
    else{
      if(reason == 'pause'){ change = 'PAUSED'; }
      if(reason == 'resume'){ change = 'ACTIVE'; }
      MAIN.database.query("UPDATE pokebot.users SET pokemon_status = ? WHERE user_id = ?", [change,message.member.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
        else{
          let subscription_success = new Discord.RichEmbed().setColor('00ff00')
            .setAuthor(nickname, message.member.user.displayAvatarURL)
            .setTitle('Your Pokémon Subscriptions have been set to `'+change+'`!')
            .setFooter('Saved to the Pokébot Database.');
          return message.channel.send(subscription_success).then(m => m.delete(5000)).catch(console.error);
        }
      });
    }
  });
}




// SUBSCRIPTION REMOVE FUNCTION
async function subscription_view(MAIN, message, nickname, prefix){
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {

    // CHECK IF THE USER ALREADY HAS SUBSCRIPTIONS AND ADD
    if(!user[0].pokemon){ return message.reply('You have no saved subscriptions.').then(m => m.delete(5000)).catch(console.error); }
    else{

      let pokemon = JSON.parse(user[0].pokemon);

      if(!pokemon.subscriptions[0]){ return message.reply('You have no saved subscriptions.').then(m => m.delete(5000)).catch(console.error); }
      else{

        // CREATE THE EMBED
        let pokemonSubs = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Pokémon Subscriptions')
          .setDescription('Overall Status: `'+user[0].status+'`\nPokemon Status: `'+user[0].pokemon_status+'`')
          .setFooter('You can \'view\', \'add\', \'remove\', or \'edit\'.');

        // IF POKEMON SUBSCRIPTIONS OVER 25
        if(pokemon.subscriptions.length > 25){
          for(let e = 0; e < pokemon.subscriptions.length; e++){
            if(e == 24){
              message.channel.send(pokemonSubs).catch(console.error);
              pokemonSubs.fields = [];
            }

            // TURN EACH SUBSCRIPTION INTO A FIELD
            embedCP = pokemon.subscriptions[e].min_cp+'`/`'+pokemon.subscriptions[e].max_cp;
            embedIV = pokemon.subscriptions[e].min_iv+'`/`'+pokemon.subscriptions[e].max_iv;
            embedLvl = pokemon.subscriptions[e].min_lvl+'`/`'+pokemon.subscriptions[e].max_lvl;
            pokemonSubs.addField(pokemon.subscriptions[e].name, 'CP: `'+embedCP+'`\nIV: `'+embedIV+'`\nLvl: `'+embedLvl+'`\nGender: `'+pokemon.subscriptions[e].gender+'`', false);
          }
        }
        else{

          // TURN EACH SUBSCRIPTION INTO A FIELD
          pokemon.subscriptions.forEach((pokemon,index) => {
            embedCP = pokemon.min_cp+'`/`'+pokemon.max_cp;
            embedIV = pokemon.min_iv+'`/`'+pokemon.max_iv;
            embedLvl = pokemon.min_lvl+'`/`'+pokemon.max_lvl;
            pokemonSubs.addField(pokemon.name, 'CP: `'+embedCP+'`\nIV: `'+embedIV+'`\nLvl: `'+embedLvl+'`\nGender: `'+pokemon.gender+'`', false);
          });
        }

        // SEND THE EMBED
        message.channel.send(pokemonSubs).catch(console.error).then( msg => {

          // DEFINE COLLECTOR AND FILTER
          const filter = cMessage => cMessage.member.id==message.member.id;
          const collector = message.channel.createMessageCollector(filter, { time: 60000 });

          // FILTER COLLECT EVENT
          collector.on('collect', message => {
            switch(message.content.toLowerCase()){
              case 'add': collector.stop('add'); break;
              case 'remove': collector.stop('remove'); break;
              case 'edit': collector.stop('edit'); break;
              case 'view': collector.stop('view'); break;
              case 'pause': collector.stop('pause'); break;
              case 'resume': collector.stop('resume'); break;
              default:
                message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete(5000)).catch(console.error);
            }
          });
          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'cancel': return;
              case 'add': subscription_create(MAIN, message, nickname, prefix); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix); break;
              case 'edit': subscription_modify(MAIN, message, nickname, prefix); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix); break;
              case 'resume':
              case 'pause': subscription_status(MAIN, message, nickname, reason, prefix); break;
            }
          });
        });
      }
    }
  });
}





// SUBSCRIPTION CREATE FUNCTION
async function subscription_create(MAIN, message, nickname, prefix){

  // DEFINED THE SUBSCRIPTION OBJECT
  let sub = {};

  // RETRIEVE POKEMON NAME FROM USER
  sub.name = await sub_collector(MAIN,'Name',nickname,message, undefined,'Names are not case-sensitive.',sub);
  if(sub.name.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE MIN CP FROM USER
  sub.min_cp = await sub_collector(MAIN,'Minimum CP',nickname,message,sub.name,'Please respond with a number greater than 0 or \'All\'. Type \'Cancel\' to Stop.',sub);
  if(sub.min_cp.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE MAX CP NAME FROM USER
  sub.max_cp = await sub_collector(MAIN,'Maximum CP',nickname,message,sub.name,'Please respond with a number greater than 0 or \'All\'. Type \'Cancel\' to Stop.',sub);
  if(sub.max_cp.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE MIN IV FROM USER
  sub.min_iv = await sub_collector(MAIN,'Minimum IV',nickname,message,sub.name,'Please respond with a IV number between 0 and 100, specify minimum Atk/Def/Sta (15/14/13) Values or type \'All\'. Type \'Cancel\' to Stop.',sub);
  if(sub.min_iv.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE MAX IV FROM USER
  sub.max_iv = await sub_collector(MAIN,'Maximum IV',nickname,message,sub.name,'Please respond with a IV number between 0 and 100, specify minimum Atk/Def/Sta (15/14/13) Values or type \'All\'. Type \'Cancel\' to Stop.',sub);
  if(sub.max_iv.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE MIN LEVEL FROM USER
  sub.min_lvl = await sub_collector(MAIN,'Minimum Level',nickname,message,sub.name,'Please respond with a value between 0 and 35 or type \'All\'. Type \'Cancel\' to Stop.',sub);
  if(sub.min_lvl.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE MAX LEVEL FROM USER
  sub.max_lvl = await sub_collector(MAIN,'Maximum Level',nickname,message,sub.name,'Please respond with a value between 0 and 35 or type \'All\'. Type \'Cancel\' to Stop.',sub);
  if(sub.max_lvl.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE GENDER FROM USER
  sub.gender = await sub_collector(MAIN,'Gender',nickname,message,sub.name,'Please respond with \'Male\' or \'Female\' or type \'All\'.',sub);
  if(sub.gender.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // RETRIEVE CONFIRMATION FROM USER
  let confirm = await sub_collector(MAIN,'Confirm',nickname,message,sub.name,'Type \'Yes\' or \'No\'. Subscription will be saved.',sub);
  if(confirm.toLowerCase() == 'cancel' || confirm.toLowerCase() == 'no'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
  else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
    let pokemon = '';

    // CHECK IF THE USER ALREADY HAS SUBSCRIPTIONS AND ADD
    if(!user[0].pokemon){
      pokemon = {};
      pokemon.subscriptions = [];
      pokemon.subscriptions.push(sub);
    }
    else{
      pokemon = JSON.parse(user[0].pokemon);
      if(!pokemon.subscriptions[0]){ pokemon.subscriptions.push(sub); }
      else{

        // CONVERT TO OBJECT AND CHECK EACH SUBSCRIPTION
        pokemon = JSON.parse(user[0].pokemon);
        pokemon.subscriptions.forEach((subscription,index) => {

          // ADD OR OVERWRITE IF EXISTING
          if(subscription.name == sub.name){ pokemon.subscriptions[index] = sub; }
          else if(index == pokemon.subscriptions.length-1){ pokemon.subscriptions.push(sub); }
        });
      }
    }

    // STRINGIFY THE OBJECT
    let newSubs = JSON.stringify(pokemon);

    // UPDATE THE USER'S RECORD
    MAIN.database.query("UPDATE pokebot.users SET pokemon = ? WHERE user_id = ?", [newSubs,message.member.id], function (error, user, fields) {
      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
      else{
        let subscription_success = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle(sub.name+' Subscription Complete!')
          .setDescription('Saved to the Pokébot Database.')
          .setFooter('You can \'view\', \'add\', \'remove\', \'edit\', \'pause\' or \'resume\'.');
        return message.channel.send(subscription_success).then( msg => {

          // DEFINE COLLECTOR AND FILTER
          const filter = cMessage => cMessage.member.id==message.member.id;
          const collector = message.channel.createMessageCollector(filter, { time: 60000 });

          // FILTER COLLECT EVENT
          collector.on('collect', message => {
            switch(message.content.toLowerCase()){
              case 'add': collector.stop('add'); break;
              case 'remove': collector.stop('remove'); break;
              case 'edit': collector.stop('edit'); break;
              case 'view': collector.stop('view'); break;
              case 'pause': collector.stop('pause'); break;
              case 'resume': collector.stop('resume'); break;
              default:
                message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete(5000)).catch(console.error);
            }
          });
          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'cancel': return;
              case 'add': subscription_create(MAIN, message, nickname, prefix); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix); break;
              case 'edit': subscription_modify(MAIN, message, nickname, prefix); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix); break;
              case 'resume':
              case 'pause': subscription_status(MAIN, message, nickname, reason, prefix); break;
            }
          });
        });
      }
    });
  });
}





// SUBSCRIPTION REMOVE FUNCTION
async function subscription_remove(MAIN, message, nickname, prefix){

  // FETCH USER FROM THE USERS TABLE
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], async function (error, user, fields) {

    // END IF USER HAS NO SUBSCRIPTIONS
    if(!user[0].pokemon){ return message.reply('You do not have any active Pokémon subscriptions.').then(m => m.delete(5000)).catch(console.error); }
    else {

      // PARSE THE STRING TO AN OBJECT
      let pokemon = JSON.parse(user[0].pokemon), found = false;

      // FETCH NAME OF POKEMON TO BE REMOVED AND CHECK RETURNED STRING
      let remove_name = await sub_collector(MAIN,'Remove',nickname,message, undefined,'Type the Pokémon\'s name or \'all\'. Names are not case-sensitive.', undefined);
      switch(remove_name.toLowerCase()){
        case 'cancel': return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error);
        case 'all': found = true; pokemon.subscriptions = []; break;
        default:

          // CHECK THE USERS RECORD FOR THE SUBSCRIPTION
          pokemon.subscriptions.forEach((subscription,index) => {

            console.log(subscription.name.toLowerCase()+' '+remove_name.toLowerCase());

            if(subscription.name.toLowerCase() == remove_name.toLowerCase()){

              found = true;

              // REMOVE THE SUBSCRIPTION
              pokemon.subscriptions.splice(index,1);
            }
          });

      }

      // RETURN NOT FOUND
      if(found == false){ return message.reply('You are not subscribed to that Pokémon.').then(m => m.delete(5000)).catch(console.error); }

      // STRINGIFY THE OBJECT
      let newSubs = JSON.stringify(pokemon);

      // UPDATE THE USER'S RECORD
      MAIN.database.query("UPDATE pokebot.users SET pokemon = ? WHERE user_id = ?", [newSubs,message.member.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
        else{
          let subscription_success = new Discord.RichEmbed().setColor('00ff00')
            .setAuthor(nickname, message.member.user.displayAvatarURL)
            .setTitle(remove_name+' Subscription Removed!')
            .setDescription('Saved to the Pokébot Database.')
            .setFooter('You can \'view\', \'add\', \'remove\', \'edit\', \'pause\' or \'resume\'.');
          return message.channel.send(subscription_success).then( msg => {

            // DEFINE COLLECTOR AND FILTER
            const filter = cMessage => cMessage.member.id==message.member.id;
            const collector = message.channel.createMessageCollector(filter, { time: 60000 });

            // FILTER COLLECT EVENT
            collector.on('collect', message => {
              switch(message.content.toLowerCase()){
                case 'add': collector.stop('add'); break;
                case 'remove': collector.stop('remove'); break;
                case 'edit': collector.stop('edit'); break;
                case 'view': collector.stop('view'); break;
                case 'pause': collector.stop('pause'); break;
                case 'resume': collector.stop('resume'); break;
                default:
                  message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete(5000)).catch(console.error);
              }
            });
            // COLLECTOR HAS BEEN ENDED
            collector.on('end', (collected,reason) => {

              // DELETE ORIGINAL MESSAGE
              msg.delete();
              switch(reason){
                case 'cancel': return;
                case 'add': subscription_create(MAIN, message, nickname, prefix); break;
                case 'remove': subscription_remove(MAIN, message, nickname, prefix); break;
                case 'edit': subscription_modify(MAIN, message, nickname, prefix); break;
                case 'view': subscription_view(MAIN, message, nickname, prefix); break;
                case 'resume':
                case 'pause': subscription_status(MAIN, message, nickname, reason, prefix); break;
              }
            });
          });
        }
      });
    }
  });
}






// SUBSCRIPTION MODIFY FUNCTION
async function subscription_modify(MAIN, message, nickname, prefix){
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], async function (error, user, fields) {
    if(!user[0].pokemon){
      return message.reply('You do not have any active Pokémon subscriptions.').then(m => m.delete(5000)).catch(console.error);
    }
    else {

      // PARSE STRING TO AN OBJECT
      let pokemon = JSON.parse(user[0].pokemon), found = false;

      // GET THE NAME OF THE POKEMON THE USER WANTS TO MODIFY
      let modify_name = await sub_collector(MAIN,'Modify',nickname,message, undefined,'Type the Pokémon\'s name. Names are not case-sensitive.',undefined);

      // CHECK IF THE USER CANCELLED THE ACTION
      switch(modify_name.toLowerCase()){
        case 'cancel': return;
        default:

          // CHECK IF THE POKEMON IS IN THEIR SUBSCRIPTIONS
          pokemon.subscriptions.forEach((subscription,index) => {
            if(subscription.name.toLowerCase() == modify_name.toLowerCase()){

              // REMOVE THE OLD SUBSCRIPTION
              found = true; pokemon.subscriptions.splice(index,1);
            }
          });

          if(found == false){ return message.reply('You are not subscripted to that pokemon.').then(m => m.delete(5000)).catch(console.error); }

          // DEFINE THE NEW SUBSCRIPTION AND REQUEST DETAILS
          let sub = {};
          sub.name = modify_name;

          // RETRIEVE MIN CP FROM USER
          sub.min_cp = await sub_collector(MAIN,'Minimum CP',nickname,message,sub.name,'Please respond with a number greater than 0 or \'All\'. Type \'Cancel\' to Stop.',sub);
          if(sub.min_cp.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE MAX CP NAME FROM USER
          sub.max_cp = await sub_collector(MAIN,'Maximum CP',nickname,message,sub.name,'Please respond with a number greater than 0 or \'All\'. Type \'Cancel\' to Stop.',sub);
          if(sub.max_cp.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE MIN IV FROM USER
          sub.min_iv = await sub_collector(MAIN,'Minimum IV',nickname,message,sub.name,'Please respond with a IV number between 0 and 100, specify minimum Atk/Def/Sta (15/14/13) Values or type \'All\'. Type \'Cancel\' to Stop.',sub);
          if(sub.min_iv.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE MAX IV FROM USER
          sub.max_iv = await sub_collector(MAIN,'Maximum IV',nickname,message,sub.name,'Please respond with a IV number between 0 and 100, specify minimum Atk/Def/Sta (15/14/13) Values or type \'All\'. Type \'Cancel\' to Stop.',sub);
          if(sub.max_iv.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE MIN LEVEL FROM USER
          sub.min_lvl = await sub_collector(MAIN,'Minimum Level',nickname,message,sub.name,'Please respond with a value between 0 and 35 or type \'All\'. Type \'Cancel\' to Stop.',sub);
          if(sub.min_lvl.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE MAX LEVEL FROM USER
          sub.max_lvl = await sub_collector(MAIN,'Maximum Level',nickname,message,sub.name,'Please respond with a value between 0 and 35 or type \'All\'. Type \'Cancel\' to Stop.',sub);
          if(sub.max_lvl.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE GENDER FROM USER
          sub.gender = await sub_collector(MAIN,'Gender',nickname,message,sub.name,'Please respond with \'Male\' or \'Female\' or type \'All\'.',sub);
          if(sub.gender.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // RETRIEVE CONFIRMATION FROM USER
          let confirm = await sub_collector(MAIN,'Confirm',nickname,message,sub.name,'Type \'Yes\' or \'No\'. Subscription will be saved.',sub);
          if(confirm.toLowerCase() == 'cancel' || confirm.toLowerCase() == 'no'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
          else if(sub.name == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

          // ADD THE NEW SUBSCRIPTION
          pokemon.subscriptions.push(sub);

          // STRINGIFY THE OBJECT
          let newSubs = JSON.stringify(pokemon);

          // UPDATE THE USER'S RECORD
          MAIN.database.query("UPDATE pokebot.users SET pokemon = ? WHERE user_id = ?", [newSubs,message.member.id], function (error, user, fields) {
            if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
            else{
              let modification_success = new Discord.RichEmbed().setColor('00ff00')
                .setAuthor(nickname, message.member.user.displayAvatarURL)
                .setTitle(sub.name+' Subscription Modified!')
                .setDescription('Saved to the Pokébot Database.')
                .setFooter('You can \'view\', \'add\', \'remove\', \'edit\', \'pause\' or \'resume\'.');
              return message.channel.send(modification_success).then( msg => {

                // DEFINE COLLECTOR AND FILTER
                const filter = cMessage => cMessage.member.id==message.member.id;
                const collector = message.channel.createMessageCollector(filter, { time: 60000 });

                // FILTER COLLECT EVENT
                collector.on('collect', message => {
                  switch(message.content.toLowerCase()){
                    case 'add': collector.stop('add'); break;
                    case 'remove': collector.stop('remove'); break;
                    case 'edit': collector.stop('edit'); break;
                    case 'view': collector.stop('view'); break;
                    case 'pause': collector.stop('pause'); break;
                    case 'resume': collector.stop('resume'); break;
                    default:
                      message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete(5000)).catch(console.error);
                  }
                });
                // COLLECTOR HAS BEEN ENDED
                collector.on('end', (collected,reason) => {

                  // DELETE ORIGINAL MESSAGE
                  msg.delete();
                  switch(reason){
                    case 'cancel': return;
                    case 'add': subscription_create(MAIN, message, nickname, prefix); break;
                    case 'remove': subscription_remove(MAIN, message, nickname, prefix); break;
                    case 'edit': subscription_modify(MAIN, message, nickname, prefix); break;
                    case 'view': subscription_view(MAIN, message, nickname, prefix); break;
                    case 'resume':
                    case 'pause': subscription_status(MAIN, message, nickname, reason, prefix); break;
                  }
                });
              });
            }
          });
      }
    }
  });
}





// SUB COLLECTOR FUNCTION
function sub_collector(MAIN,type,nickname,message,pokemon,requirements,sub){
  return new Promise(function(resolve, reject) {

    // DELCARE VARIABLES
    let timeout = true, instruction = '';

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id == message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 60000 });

    switch(type){

      // POKEMON NAME EMBED
      case 'Name':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Pokémon would you like to Subscribe to?')
          .setFooter(requirements); break;

      // CONFIRMATION EMBED
      case 'Confirm':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Does all of this look correct?\nName: `'+sub.name+'`\nMin CP: `'+sub.min_cp+'`\nMax CP: `'+sub.max_cp+'`\nMin IV: `'+sub.min_iv+'`\nMax IV: `'+sub.max_iv+'`\nMin Lvl: `'+sub.min_lvl+'`\nMax Lvl: `'+sub.max_lvl+'`\nGender: `'+sub.gender+'`')
          .setFooter(requirements); break;

      // REMOVEAL EMBED
      case 'Remove':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Pokémon do you want to remove?')
          .setFooter(requirements); break;

      // MODIFY EMBED
      case 'Modify':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Pokémon do you want to modify?')
          .setFooter(requirements); break;

      // DEFAULT EMBED
      default:
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What **'+type+'** would like you like to set for **'+pokemon+'** Notifications?')
          .setFooter(requirements);
    }

    message.channel.send(instruction).catch(console.error).then( msg => {

      // DEFINED VARIABLES
      let input = '';

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(true){

          // CANCEL SUB
          case message.content.toLowerCase() == 'ACTIVE':
          case message.content.toLowerCase() == 'cancel': collector.stop('cancel'); break;

          // POKEMON NAME
          case type.indexOf('Name')>=0:
          case type.indexOf('Modify')>=0:
          case type.indexOf('Remove')>=0:
            if(message.content.toLowerCase() == 'all'){ collector.stop('ALL'); break; }
            for(let p = 1; p < 723; p++){
              if(p == 722){ message.reply('`'+message.content+'` doesn\'t appear to be a valid Pokémon name. Please check the spelling and try again.').then(m => m.delete(5000)).catch(console.error); break; }
              else if(message.content.toLowerCase() == MAIN.pokemon[p].name.toLowerCase()){ collector.stop(MAIN.pokemon[p].name); break; }
            } break;

          // CP CONFIGURATION
          case type.indexOf('CP')>=0:
            if(parseInt(message.content) > 0){ collector.stop(message.content); }
            else if(message.content.toLowerCase() == 'all'){ collector.stop('ALL'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); } break;

          // MIN/MAX IV CONFIGURATION
          case type.indexOf('IV')>=0:
            if(parseInt(message.content) >= 0 && parseInt(message.content) <= 100){ collector.stop(message.content); }
            else if(message.content.toLowerCase() == 'all'){ collector.stop('ALL'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); } break;

          // MIN/MAX LEVEL CONFIGURATION
          case type.indexOf('Level')>=0:
            if(parseInt(message.content) >= 0 && parseInt(message.content) <= 35){ collector.stop(message.content); }
            else if(message.content.toLowerCase() == 'all'){ collector.stop('ALL'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); } break;

          // GENDER CONFIGURATION
          case type.indexOf('Gender')>=0:
            if(message.content.toLowerCase() == 'male'){ collector.stop('Male'); }
            else if(message.content.toLowerCase() == 'female'){ collector.stop('Female'); }
            else if(message.content.toLowerCase() == 'all'){ collector.stop('ALL'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); } break;

          // GET CONFIRMATION
          case type.indexOf('Confirm')>=0:
            if(message.content.toLowerCase() == 'yes'){ collector.stop('Yes'); }
            else if(message.content.toLowerCase() == 'no'){ collector.stop('No'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); } break;
        }
      });

      // COLLECTOR ENDED
      collector.on('end', (collected,reason) => {
        msg.delete(); resolve(reason);
      });
    });
  });
}