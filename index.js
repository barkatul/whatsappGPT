const OpenAI = require('openai');
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const makeWASocket = require('@whiskeysockets/baileys').default;
const replies = [];

const apiKey = "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"
const openai = new OpenAI({
    apiKey: apiKey,
})

async function connectionLogic(){
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('connection.update', async(update) => {
        const { connection, lastDisconnect } = update;

        if(update?.qr){
            console.log(update?.qr);
        }
        if(connection ==='close'){
            const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

        if(shouldReconnect){
            connectionLogic();
        }
        }
    });
    sock.ev.on("messages.update", (messageInfo) => {
        console.log(messageInfo);
    });

    sock.ev.on('messages.upsert', async (messageInfoUpsert) => {

        const message = messageInfoUpsert.messages[0].message.conversation;
        const userName = messageInfoUpsert.messages[0].pushName;
        const remoteJid = messageInfoUpsert.messages[0].key.remoteJid;
        const key_id = messageInfoUpsert.messages[0].key.id;
        const timeStamp = messageInfoUpsert.messages[0].messageTimestamp;

        console.log(messageInfoUpsert);
        console.log(messageInfoUpsert.messages[0].message);
        console.log(message);
        console.log('Reply to ', userName);
        console.log('ID : ', remoteJid);
        console.log('Unique ID: ', key_id);

        console.log(timeStamp)
        console.log(timeStamp)

        //upar tak sab thik hai ab jo karna hai drama yaha kro


        if(!replies.includes(timeStamp) && message!=""){

            try{
                const gptResponse = await main({ text: message});
                sock.sendMessage(remoteJid, {text: gptResponse});
                replies.push(timeStamp);
            }
            catch(error){
                console.error('Error Processing message: ', error);
            }
        }
        console.log(timeStamp)
    })

    sock.ev.on ('creds.update', saveCreds);
}

async function main(req) {

    try{
        const completion = await openai.chat.completions.create({
            messages: [
              { role: "system", content: "Act like a personal assistant" }, // Replace with your system message
              { role: "user", content: req.text },
            ],
            model: "gpt-3.5-turbo",
          });
      
          console.log(completion.choices[0].message.content);
          return completion.choices[0].message.content;
    }
    catch(error){
        console.error('Error calling GPT', error);
        throw error;
    }
}
connectionLogic()