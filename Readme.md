
# SMART MEDICAL RECORDS
This a ***Azle*** Smart Contract that let's a person store their medical records(Records can be generalized to any document uploaded on the IPFS). This let's the user store their data forever on the blockchain, while also making sure no-one apart from them can access it(Implemented through access control and caller checks). This is a prototype version and the use case can be extended to allowing to share with chosen people, NFT Holders etc.


# GUIDE TO FUNCTIONS
1. getAllRecords() = Fetches records of the caller. Only the records that you have created will be returned.
2. getRecord(id: string) = Fetch a particular record using the Record Id. Access control is implemented here too.
3. addRecord(payload: MedicalRecordPayload) = Add medical records. They have to follow the pattern of 
```json
 title: string;
attachmentURL: string;
```
4. updateRecord() = Update the contents of the Records. Access control applicable.
5. deleteRecord() = Delete Records from the mapping. Access control applicable.

# RUN LOCALLY

1. Run `npm install`.
2. Make sure you have DFX installed, if not install from here [installation](https://demergent-labs.github.io/azle/installation.html).
3. Run `dfx start --background` to get dfx started.
4. Run `dfx deploy` to deploy the code(First time takes several minutes so have patience).
5. Now you can interact using the dfx cli or the web interface(link will be visible after deployment).