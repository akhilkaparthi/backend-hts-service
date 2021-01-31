# backend-hts-service
Steps:
1. Clone the repository.
2. Create .env file as .envSample
3. Specify which network you want to choose

This javascript is used to implement HTS service with various usecases.

USECASE: Vaccine Passport adn Fine Art Tokenization 

Implement a token service.
First: create two user.
Second: create a token either NFT or FT
Third: Associate tokens with users
Fourth: Transfer tokens from one user to another user.
Transfer token between the users.

H21:Create NFT token for the property by adding multiple property information such as documents, photos
1: Upload a file into Hedera Network then new file id will be generated.
2: Use this file id for adding in Token.
3: Implement multiple file id and add into the token.
4: (next case) add multiple files into single file service.
H21: How to transfer such created token
1: Associate the multiple users to token:
2: Use frist user's private key to sign the transaction and then second user should received the token.
H21: Adding text like info to Fungible as well as NFT tokens
1:Use transaction memo for adding the fileId
H21:Implement this and show what kind of information we can add, share and see transperently in Kabuto
1:Give reference to the Kabuto for above transactions.
H21: KYC Integration (front end)
1: Take dummy data/ Key as input and show that based on it KYC flag is changed
2: "Prepare KYC -flow Where your need input from 3rd party KYC vendor and how that is coded in our application Curently take it dummy code"
3: 3rd Party KYC vendor witll give out this key after integration
4: "Initial KYC/AML providers selection-need to check how easy is integration. This need to be done by implementing it in our demo 
   https://www.veriff.com/product KYC/AML, very expensive, has trial of 100 KYC free
   https://kyc-chain.com/kyc-workflow-solution/ -KYC, Crypto AML, good for ICO/STO and Blockchain"
H21: Create Shadwell NFT and link 100 Fungible Tokens under that
1: Fungible tokens represent shares, can be traded
H21: Reading from the data in file services
H21: Updating the docuemtns stored in file service-adding the documents
H21: Updating the docuemnts- updating the same docuements, overwriting it or editing it 
<<<<<<< HEAD

??
1. tokens signing.
2. integrate jubayers code.
3. follow up remaining code.
4. Android 
=======
>>>>>>> aad7aa358c3e099ef1c096d986ce7c284262fac9
