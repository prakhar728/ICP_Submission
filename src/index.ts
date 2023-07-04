// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import random from "random";


/**
 * This type represents a message that can be listed on a board.
 */
type Message = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type MessagePayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>


const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024);


$query;
export function getMessages(): Result<Vec<Message>, string> {
    return Result.Ok(messageStorage.values());
}


$query;
export function getMessage(id: string): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => Result.Ok<Message, string>(message),
        None: () => Result.Err<Message, string>(`a message with id=${id} not found`)
    });
}


$update;
export function addMessage(payload: MessagePayload): Result<Message, string> {
    const message: Message = { id: generateRandomString44(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    messageStorage.insert(message.id, message);
    return Result.Ok(message);
}

$update;
export function updateMessage(id: string, payload: MessagePayload): Result<Message, string> {
    return match(messageStorage.get(id), {
        Some: (message) => {
            const updatedMessage: Message = {...message, ...payload, updatedAt: Opt.Some(ic.time())};
            messageStorage.insert(message.id, updatedMessage);
            return Result.Ok<Message, string>(updatedMessage);
        },
        None: () => Result.Err<Message, string>(`couldn't update a message with id=${id}. message not found`)
    });

}

$update;
export function deleteMessage(id: string): Result<Message, string> {
    return match(messageStorage.remove(id), {
        Some: (deletedMessage) => Result.Ok<Message, string>(deletedMessage),
        None: () => Result.Err<Message, string>(`couldn't delete a message with id=${id}. message not found.`)
    });
}

// globalThis.crypto = {
//     getRandomValues: () => {
//       let array = new Uint8Array(32)
  
//       for (let i = 0; i < array.length; i++) {
//         array[i] = Math.floor(Math.random() * 256)
//       }
  
//       return array;
//     }
//   };


function generateRandomString44() {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomString = new Array(30).fill(null);
  for (let i = 0; i < 30; i++) {
    const randomIndex = random.int(0, characters.length - 1);
    randomString[i] = characters[randomIndex];
  }
  return randomString.join("");
}