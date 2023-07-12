// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt,Principal } from 'azle';
import random from "random";


/**
 * This type Medical Record that can be listed on a board.
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


// Function to fetch all MedicalRecords of the caller
$query;
export function getAllRecords(): Result<Vec<MedicalRecord>, string> {
    let records = recordStorage.values();
    let filteredRecords = [];
    // filter through all records and return only MedicalRecords created by the caller
    for (let record of records) {
        if (record.CreatorId.toString() === ic.caller().toString()) {
            filteredRecords.push(record);
        }
    }
    return Result.Ok(filteredRecords);
}

// Function to fetch a MedicalRecord
$query;
export function getRecord(id: string): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) =>{
            // return an error message if caller isn't the creator of the MedicalRecord
            if(record.CreatorId.toString() !== ic.caller().toString())
            return Result.Err<MedicalRecord, string>(`Only the creator can update the Record`);

            return Result.Ok<MedicalRecord, string>(record)},
        None: () => Result.Err<MedicalRecord, string>(`The Record with id=${id} not found`)
    });
}

// Function to return the current caller
$query;
export function getCaller(): Result<Principal,string> {
    return Result.Ok(ic.caller());
}

// Function to fetch the creatorId of a MedicalRecord
$query;
export function getCreatorId(id: string): Result<Principal,string> {
    return match(recordStorage.get(id), {
        Some: (record) => Result.Ok<Principal, string>(record.CreatorId),
        None: () => Result.Err<Principal, string>(`The Record with id=${id} not found`)
    });
}

// Function to add a MedicalRecord to the storage
$update;
export function addRecord(payload: MedicalRecordPayload): Result<MedicalRecord, string> {
    const isErrPayload = checkPayload(payload); // checks if payload has valid input data
    // checks if an error message was returned
    if(isErrPayload.length > 0){
        // return the error message
        return Result.Err<MedicalRecord, string>(isErrPayload)
    }
    // create MedicalRecord
    const record: MedicalRecord = { id: generateRandomString44(),CreatorId:ic.caller(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    // store MedicalRecord to the storage
    recordStorage.insert(record.id, record);
    return Result.Ok(record);
}

// Function to update a MedicalRecord. Caller must be the creator of the MedicalRecord
$update;
export function updateRecord(id: string, payload: MedicalRecordPayload): Result<MedicalRecord, string> {
    const isErrPayload = checkPayload(payload); // checks if payload has valid input data
    // checks if an error message was returned
    if(isErrPayload.length > 0){
        // return the error message
        return Result.Err<MedicalRecord, string>(isErrPayload)
    }
    return match(recordStorage.get(id), {
        Some: (record) => {
            // return an error message if caller isn't the creator of the MedicalRecord
            if(record.CreatorId.toString() !== ic.caller().toString())
            return Result.Err<MedicalRecord, string>(`Only the creator can update the Record`);

            const updatedRecord: MedicalRecord = {...record, ...payload, updatedAt: Opt.Some(ic.time())};
            // Save updated MedicalRecord to storage
            recordStorage.insert(record.id, updatedRecord);
            return Result.Ok<MedicalRecord, string>(updatedRecord);
        },
        None: () => Result.Err<MedicalRecord, string>(`couldn't update a record with id=${id}. Record not found`)
    });

}

// Function to delete a MedicalRecord. Caller must be the creator of the MedicalRecord
$update;
export function deleteRecord(id: string): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            // return an error message if caller isn't the creator of the MedicalRecord
            if(record.CreatorId.toString() !== ic.caller().toString())
            return Result.Err<MedicalRecord, string>(`Only the creator can delete the Record`);
            // remove MedicalRecord from storage
            recordStorage.remove(id);
           return Result.Ok<MedicalRecord, string>(record)
        },
        None: () => Result.Err<MedicalRecord, string>(`couldn't delete a record with id=${id}. Record not found.`)
    });
}

// function that ensures that the title and body of the payload aren't empty strings
function checkPayload(payload: MedicalRecordPayload): string {
    if(payload.title.trim().length == 0){
        return "Empty title";
    }
    if(payload.attachmentURL.trim().length == 0){
        return "Empty URL";
    }
    return "";
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