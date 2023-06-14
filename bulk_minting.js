const csv = require("csvtojson");
const { toUtf8 } = require('@cosmjs/encoding');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { GasPrice } = require('@cosmjs/stargate');

const MNEMONIC = "add minter's mnemonic at here";
const COLLECTION_CONTRACT_ADDRESS = "aura1000000000000000000000000000000000CollectionContractAddress";

async function main() {
    // ************
    // CHAIN CONFIG
    // ************
    const mainnet = {
        rpcEndpoint: 'https://rpc.aura.network',
        prefix: 'aura',
        denom: 'uaura',
        chainId: 'xstaxy-1',
        broadcastTimeoutMs: 5000,
        broadcastPollIntervalMs: 1000
    };
    // ***************************
    // SETUP INFORMATION FOR USERS
    // ***************************
    // connect deployer wallet to chain and get admin account
    let deployerWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        MNEMONIC,
        {
            prefix: mainnet.prefix
        }
    );
    // gas price
    const gasPrice = GasPrice.fromString(`0.025${mainnet.denom}`);
    let deployerClient = await SigningCosmWasmClient.connectWithSigner(mainnet.rpcEndpoint, deployerWallet, { gasPrice });
    let deployerAccount = (await deployerWallet.getAccounts())[0];

    // Convert a csv file with csvtojson
    csv().fromFile(`${__dirname}/list.csv`)
        .then(async function (jsonArrayObj) {
            // ****************
            // EXECUTE CONTRACT
            // ****************
            let number_mess = 0;
            let mint_messages = [];

            //init the token_id_anchor
            let current_time = new Date().getTime(); 	// get current time in milliseconds
            // due to the fact that multi minting maybe happen at the same time with the single minting
            // we will add 30000000000 milliseconds (almost 1 year)
            // to the current time to make sure that the token_id is unique
            let token_id_anchor = current_time + 30000000000;

            // now, mint...
            for (let i = 0; i < jsonArrayObj.length; i++) {
                number_mess += 1;
                let token_info = jsonArrayObj[i];

                let token_id = "";
                if (token_info.hasOwnProperty("token_id") && token_info["token_id"] != "") {
                    token_id = token_info["token_id"];
                } else {
                    token_id = (token_id_anchor + i).toString();
                }

                // prepare mint message
                let mint_message = {
                    "mint": {
                        "token_id": token_id,
                        "owner": token_info["receiving address"],
                        "extension": {
                            "name": token_info["name"],
                            "image": token_info["image"],
                            "description": token_info["description"],
                            "animation_url": token_info["animation_url"],
                            "attributes": JSON.parse(token_info["attributes"]),
                        }
                    }
                };
                console.log(mint_message);

                // prepare broadcast message
                let broadcast_mess = {
                    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                    value: {
                        sender: deployerAccount.address,
                        contract: COLLECTION_CONTRACT_ADDRESS,
                        msg: toUtf8(JSON.stringify(mint_message)),
                    },
                };

                // push broadcast message to array
                mint_messages.push(broadcast_mess);

                // we will send maximum 100 messages in a transaction
                if (number_mess == `100` || i == jsonArrayObj.length - 1) {
                    console.log("Minting...");
                    await deployerClient.signAndBroadcast(deployerAccount.address, mint_messages, 'auto');

                    // reset params
                    number_mess = 0;
                    mint_messages = [];
                }
            }
            console.log("Minting complete!");
        }
        )
}

main();
