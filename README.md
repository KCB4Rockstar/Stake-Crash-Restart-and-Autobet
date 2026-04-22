This script also renders graphics on top of the page to help track the state of the script and your bets.

Here are the configurations in the script.

//----USER CONFIGURATIONS//////////

//-Crash Configuration
let keepRunning = false; //state of the script. true if it's running. This should be kept as true by default to accomodate page reloads/refreshes.
let baseValue = '0.00000000'; //Base betting value for when the script launches or resets itself.
let cashoutMP = '2'; //the multiplier for the cashout
let onLossValue = '0'; //the increase of the current bet value as a percentage (20%)
let lossThreshold = 1; //the amount of losses required to keep the automated bet value instead of resetting to the base value

//Auto Claim starts to work 1hr from execution of the script, so using the manual button when first launching the script.

//-VIP Reload Configuration
let autoClaimReload = false; //if true, the script will attempt to collect the preferred coin for the VIP Reload every 1hr.
let preferredCoinForReload = 'usdt'; //For the reload script, which coin should it attempt to collect.
//Preferred Coin can be: btc, eth, ltc, usdt, doge, bch, xrp, eos, trx,
// bnb, usdc, ape, busd, cro, dai, link, sand, shib, uni, matic

//-VIP Rakeback Configuration
let autoClaimRakeback = false; //if true, the script will attempt to collect the VIP Rakeback every 1hr.

//----END OF USER CONFIGURATIONS--------/
