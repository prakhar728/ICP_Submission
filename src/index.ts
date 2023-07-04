import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import random from "random";

/**
 * This type represents a medical record that can be listed on a board.
 */
type MedicalRecord = Record<{
    id: string;
    title: string;
    CreatorId: Principal;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type MedicalRecordPayload = Record<{
    title: string;
    attachmentURL: string;
}>


const recordStorage = new StableBTreeMap<string, MedicalRecord>(0, 44, 1024);


/**
 * Retrieves all the medical records created by the caller.
 * @returns A Result containing an array of MedicalRecord objects or an error message.
 */
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

/**
 * Retrieves a specific medical record by its ID.
 * @param id The ID of the medical record to retrieve.
 * @returns A Result containing the MedicalRecord object or an error message.
 */
$query;
export function getRecord(id: string): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            if (record.CreatorId.toString() !== ic.caller().toString())
                return Result.Err<MedicalRecord, string>(`Only the creator can update the record.`);
            return Result.Ok<MedicalRecord, string>(record)
        },
        None: () => Result.Err<MedicalRecord, string>(`The record with id=${id} not found.`)
    });
}

/**
 * Retrieves the caller's Principal.
 * @returns A Result containing the caller's Principal or an error message.
 */
$query;
export function getCaller(): Result<Principal, string> {
    return Result.Ok(ic.caller());
}

/**
 * Retrieves the CreatorId of a specific medical record.
 * @param id The ID of the medical record.
 * @returns A Result containing the CreatorId or an error message.
 */
$query;
export function getCreatorId(id: string): Result<Principal, string> {
    return match(recordStorage.get(id), {
        Some: (record) => Result.Ok<Principal, string>(record.CreatorId),
        None: () => Result.Err<Principal, string>(`The record with id=${id} not found.`)
    });
}

/**
 * Adds a new medical record to the canister.
 * @param payload The payload containing the title and attachmentURL of the record.
 * @returns A Result containing the created MedicalRecord object or an error message.
 */
$update;
export function addRecord(payload: MedicalRecordPayload): Result<MedicalRecord, string> {
    const record: MedicalRecord = { id: generateRandomString44(), CreatorId: ic.caller(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    recordStorage.insert(record.id, record);
    return Result.Ok(record);
}

/**
 * Updates an existing medical record.
 * @param id The ID of the record to update.
 * @param payload The payload containing the updated title and attachmentURL.
 * @returns A Result containing the updated MedicalRecord object or an error message.
 */
$update;
export function updateRecord(id: string, payload: MedicalRecordPayload): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            if (record.CreatorId.toString() !== ic.caller().toString())
                return Result.Err<MedicalRecord, string>(`Only the creator can update the record.`);
            const updatedRecord: MedicalRecord = { ...record, ...payload, updatedAt: Opt.Some(ic.time()) };
            recordStorage.insert(record.id, updatedRecord);
            return Result.Ok<MedicalRecord, string>(updatedRecord);
        },
        None: () => Result.Err<MedicalRecord, string>(`Couldn't update the record with id=${id}. Record not found.`)
    });
}

/**
 * Deletes a medical record.
 * @param id The ID of the record to delete.
 * @returns A Result containing the deleted MedicalRecord object or an error message.
 */
$update;
export function deleteRecord(id: string): Result<MedicalRecord, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            if (record.CreatorId.toString() !== ic.caller().toString())
                return Result.Err<MedicalRecord, string>(`Only the creator can delete the record.`);
            recordStorage.remove(id);
            return Result.Ok<MedicalRecord, string>(record)
        },
        None: () => Result.Err<MedicalRecord, string>(`Couldn't delete the record with id=${id}. Record not found.`)
    });
}

/**
 * Shares a medical record with a recipient by updating its permissions.
 * @param id The ID of the record to share.
 * @param recipient The Principal of the recipient to share the record with.
 * @returns A Result indicating the success of the operation or an error message.
 */
$update;
export function shareRecord(id: string, recipient: Principal): Result<void, string> {
    return match(recordStorage.get(id), {
        Some: (record) => {
            if (record.CreatorId.toString() !== ic.caller().toString())
                return Result.Err<void, string>(`Only the creator can share the record.`);
            // Implement the logic to update the record's permissions or add the recipient's Principal to the authorized users.
            // Example: record.permissions.add(recipient);
            return Result.Ok<void, string>(undefined);
        },
        None: () => Result.Err<void, string>(`The record with id=${id} not found.`)
    });
}

/**
 * Searches for medical records based on specific criteria.
 * @param keyword The keyword to search for in record titles.
 * @returns A Result containing an array of matching MedicalRecord objects or an error message.
 */
$query;
export function searchRecords(keyword: string): Result<Vec<MedicalRecord>, string> {
    let records = recordStorage.values();
    let filteredRecords = [];
    for (let record of records) {
        if (record.title.toLowerCase().includes(keyword.toLowerCase())) {
            filteredRecords.push(record);
        }
    }
    return Result.Ok(filteredRecords);
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
