// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt,Principal } from 'azle';
import random from "random";


/**
 * This type Medical Reocrd that can be listed on a board.
 */
type MedicalRecord = Record<{
    id: string;
    title: string;
    CreatorId:Principal;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type MedicalRecordPayload = Record<{
    title: string;
    attachmentURL: string;
}>


const recordStorage = new StableBTreeMap<string, MedicalRecord>(0, 44, 1024);


$query;
export function getAllRecords(): Result<Vec<MedicalRecord>, string> {
    let records = recordStorage.values();
    let filteredRecords = [];
    for (let record of records) {
        if (record.CreatorId.toString() === ic.caller().toString()) {
            filteredRecords.push(record);
        }
    }
    return Result.Ok(filteredRecords);
}


$query;
export function getRecord(id: string): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) =>{
            if(record.CreatorId.toString() !== ic.caller().toString())
            return Result.Err<MedicalRecord, string>(`Only the creator can update the Record`);
            return Result.Ok<MedicalRecord, string>(record)},
        None: () => Result.Err<MedicalRecord, string>(`a message with id=${id} not found`)
    });
}

$query;
export function getCaller(): Result<Principal,string> {
    return Result.Ok(ic.caller());
}

$query;
export function getCreatorId(id: string): Result<Principal,string> {
    return match(recordStorage.get(id), {
        Some: (record) => Result.Ok<Principal, string>(record.CreatorId),
        None: () => Result.Err<Principal, string>(`a message with id=${id} not found`)
    });
}
$update;
export function addRecord(payload: MedicalRecordPayload): Result<MedicalRecord, string> {
    const message: MedicalRecord = { id: generateRandomString44(),CreatorId:ic.caller(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    recordStorage.insert(message.id, message);
    return Result.Ok(message);
}

$update;
export function updateMessage(id: string, payload: MedicalRecordPayload): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            if(record.CreatorId.toString() !== ic.caller().toString())
            return Result.Err<MedicalRecord, string>(`Only the creator can update the Record`);
            const updatedRecord: MedicalRecord = {...record, ...payload, updatedAt: Opt.Some(ic.time())};
            recordStorage.insert(record.id, updatedRecord);
            return Result.Ok<MedicalRecord, string>(updatedRecord);
        },
        None: () => Result.Err<MedicalRecord, string>(`couldn't update a message with id=${id}. message not found`)
    });

}

$update;
export function deleteMessage(id: string): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            if(record.CreatorId.toString() !== ic.caller().toString())
            return Result.Err<MedicalRecord, string>(`Only the creator can delete the Record`);
            recordStorage.remove(id);
           return Result.Ok<MedicalRecord, string>(record)
        },
        None: () => Result.Err<MedicalRecord, string>(`couldn't delete a message with id=${id}. message not found.`)
    });
}



function generateRandomString44() {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomString = new Array(30).fill(null);
  for (let i = 0; i < 30; i++) {
    const randomIndex = random.int(0, characters.length - 1);
    randomString[i] = characters[randomIndex];
  }
  return randomString.join("");
}