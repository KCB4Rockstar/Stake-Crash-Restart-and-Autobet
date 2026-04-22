// ==UserScript==
// @name         Stake Crash Auto Start Betting, Auto Reload Claim, Auto Rakeback Claim
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Gimme money at kcb4rockstar on Stake.com
// @author       fella_guy
// @match        https://stake.com/casino/games/crash
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stake.com
// @grant        none
// ==/UserScript==

console.log("Tampermonkey Script preloaded")

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

let currentBaseValue = null;
let currentCashoutMP = null;
let currentOnLossValue = null;

let autoStartCount = 0;

let biggestLoseStreak = 0;

let highestWalletAmount = 0;

let totalProfit = 0;
let totalWagered = 0;
let totalWins = 0;
let totalLosses = 0;

let lastProfit = 0;
let lastWagered = 0;
let lastWinCount = 0;
let lastLossCount = 0;

let lastWin = null;
let numLossesSinceLastWin = 0;
let startingMoneyBeforeRefresh = 0;

let usingNonBaseValue = false;

let initTime = null;

let sidebar = document.querySelector('.game-sidebar');

window.onload = function(){
  let toggleStateButton = null;
  let claimReloadButton = null;
  let claimRakebackButton = null;

  initTime = new Date();

  setTimeout(()=>{
    document.querySelector(".game-frame").insertAdjacentHTML("afterbegin", `
      <div id="tmScriptBox" style="opacity: 0.7; padding: 5px; font-size: 14px; display: flex; flex-direction: column; z-index: 500; color: white; background: grey; width: auto; height: auto; position: absolute; top: 0%; left: ${sidebar.clientWidth}px;">
        <span style="display: flex; flex-direction: column;">
          <span>Script State: <span style="color: ${keepRunning?'#00e701': 'red'}">${keepRunning?'On':'Off'}</span></span>
          <br/>
          <span>Base Value: ${baseValue}</span>
          <span style="display: ${currentBaseValue?'block':'none'};">Current Base Value: ${currentBaseValue}</span>
          <br/>
          <span>Cashout Multi: ${cashoutMP} X</span>
          <span style="display: ${currentCashoutMP?'block':'none'};">Current Cashout Multi: ${currentCashoutMP} X</span>
          <br/>
          <span>On Loss Increase By: ${onLossValue}%</span>
          <span style="display: ${currentOnLossValue?'block':'none'};">Current On Loss Increase By: ${currentOnLossValue}%</span>
          <br/>
          <span style="color: #00e701;">Last Win: ${lastWin?lastWin:'None'}</span>
          <span style="color: red;">Num Losses Since Last Win: ${numLossesSinceLastWin} (LLS: ${biggestLoseStreak})</span>
          <span style="color: blue;">Time Running: ${calculateTime()}</span>
          <span style="color: orange;">Starting Money Before Refresh: ${startingMoneyBeforeRefresh}</span>
          <span style="color: pink;">Highest Wallet Before Refresh: ${highestWalletAmount}</span>
        </span>
      </div>
    `);
    toggleStateButton = document.createElement("button");
    toggleStateButton.style = "padding: 2px; margin-top: 3px; border-radius: 3px; background: white; color: black;"
    toggleStateButton.id = "toggleStateButton";
    toggleStateButton.innerHTML="Toggle State";
    document.querySelector("#tmScriptBox").appendChild(toggleStateButton);
    toggleStateButton.addEventListener("click", toggleState, false);

    claimReloadButton = document.createElement("button");
    claimReloadButton.style = "padding: 2px; margin-top: 3px; border-radius: 3px; background: white; color: black;"
    claimReloadButton.id = "claimReloadButton";
    claimReloadButton.innerHTML="Claim Reload";
    document.querySelector("#tmScriptBox").appendChild(claimReloadButton);
    claimReloadButton.addEventListener("click", claimReload, false);

    claimRakebackButton = document.createElement("button");
    claimRakebackButton.style = "padding: 2px; margin-top: 3px; border-radius: 3px; background: white; color: black;"
    claimRakebackButton.id = "claimRakebackButton";
    claimRakebackButton.innerHTML="Claim Rakeback";
    document.querySelector("#tmScriptBox").appendChild(claimRakebackButton);
    claimRakebackButton.addEventListener("click", claimRakeback, false);

    startingMoneyBeforeRefresh = document.querySelectorAll(".currency span span")[0].innerHTML;

    console.log("Window Loaded");
  }, 1000)
}

console.log("Tampermonkey Script loaded")

async function updateScriptBox(){
  let box = document.querySelector("#tmScriptBox span");
  if(box){
    box.innerHTML = `
      <span>Script State: <span style="color: ${keepRunning?'#00e701': 'red'}">${keepRunning?'On':'Off'}</span></span>
      <br/>
      <span>Base Value: ${baseValue}</span>
      <span style="display: ${currentBaseValue?'block':'none'};">Current Base Value: ${currentBaseValue}</span>
      <br/>
      <span>Cashout Multi: ${cashoutMP} X</span>
      <span style="display: ${currentCashoutMP?'block':'none'};">Current Cashout Multi: ${currentCashoutMP} X</span>
      <br/>
      <span>On Loss Increase By: ${onLossValue}%</span>
      <span style="display: ${currentOnLossValue?'block':'none'};">Current On Loss Increase By: ${currentOnLossValue}%</span>
      <br/>
      <span style="color: #00e701;">Last Win: ${lastWin?lastWin:'None'}</span>
      <span style="color: red;">Num Losses Since Last Win: ${numLossesSinceLastWin} (LLS: ${biggestLoseStreak})</span>
      <span style="color: blue;">Time Running: ${calculateTime()}</span>
      <span style="color: orange;">Starting Money Before Refresh: ${startingMoneyBeforeRefresh}</span>
      <span style="color: pink;">Highest Wallet Before Refresh: ${highestWalletAmount}</span>
    `
  }
  await openStatsAndRead();
}

function calculateTime(){
  if(!initTime) return 0;

  var msec = new Date()-initTime;
  var hh = Math.floor(msec / 1000 / 60 / 60);
  msec -= hh * 1000 * 60 * 60;
  var mm = Math.floor(msec / 1000 / 60);
  msec -= mm * 1000 * 60;
  var ss = Math.floor(msec / 1000);
  msec -= ss * 1000;

  return hh + ":" + mm + ":" + ss;
}

function toggleState(){
  keepRunning=!keepRunning;
  updateScriptBox();
}

function pauseExecution(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, time);
  });
}

async function openStatsAndRead(){
  //[profits, wagered, wins, losses]
  //

  highestWalletAmount = document.querySelectorAll(".currency span span")[0].innerHTML>highestWalletAmount?document.querySelectorAll(".currency span span")[0].innerHTML:highestWalletAmount;

  if(!document.querySelectorAll('.draggable')[0]){
    document.querySelectorAll('.game-footer button')[2].click();
    await pauseExecution(500);
  }

  if(document.querySelectorAll('.draggable')[0]){
    let profit = parseFloat(document.querySelectorAll('.statistic span')[2].innerHTML);
    let wagered = parseFloat(document.querySelectorAll('.statistic span')[6].innerHTML);
    let wins = parseInt(document.querySelectorAll('.statistic span')[9].innerHTML);
    let losses = parseInt(document.querySelectorAll('.statistic span')[11].innerHTML);

    if(wins!==lastWinCount){
      lastWin = new Date();
      numLossesSinceLastWin = 0;
    }
    if(losses!==lastLossCount){
      numLossesSinceLastWin += (losses-lastLossCount);
      if(numLossesSinceLastWin>biggestLoseStreak){
        biggestLoseStreak = numLossesSinceLastWin;
      }
    }

    lastProfit = profit;
    lastWagered = wagered;
    lastWinCount = wins;
    lastLossCount = losses;
  }
}

async function mainScript(){
  let autoModeButton = document.querySelectorAll('.game-sidebar button')[1]

  let betAmountField = document.querySelectorAll('.game-sidebar input')[0]
  let cashoutMultiplier = document.querySelectorAll('.game-sidebar input')[1]
  let onLossIncreaseField = document.querySelectorAll('.game-sidebar input')[4]

  if(betAmountField && cashoutMultiplier && onLossIncreaseField && autoModeButton.className.split(" ").includes("active")){
    currentBaseValue = betAmountField.value;
    currentCashoutMP = cashoutMultiplier.value;
    currentOnLossValue = onLossIncreaseField.value;
  }

  if(!keepRunning) return;

  //panel
  sidebar = document.querySelector('.game-sidebar');

  if(!(!!autoModeButton.attributes['disabled'])){
    console.log("Switching to auto betting.")
    autoModeButton.click();
    await pauseExecution(50);
    if(autoModeButton.className.split(" ").includes("active")){
      let onLossIncreaseByButton = document.querySelectorAll('.game-sidebar button')[11]
      let autoBetButton = document.querySelectorAll('.game-sidebar button')[12]

      let betAmountField = document.querySelectorAll('.game-sidebar input')[0]
      let cashoutMultiplier = document.querySelectorAll('.game-sidebar input')[1]
      let onLossIncreaseField = document.querySelectorAll('.game-sidebar input')[4]

      currentBaseValue = betAmountField.value;
      currentCashoutMP = cashoutMultiplier.value;
      currentOnLossValue = onLossIncreaseField.value;

      if(autoBetButton.attributes["data-test"] && autoBetButton.attributes["data-autobet-status"]){
        let test = autoBetButton.attributes["data-test"];
        let status = autoBetButton.attributes["data-autobet-status"];

        currentBaseValue = betAmountField.value;
        currentCashoutMP = cashoutMultiplier.value;
        currentOnLossValue = onLossIncreaseField.value;

        if(test.value==="auto-bet-button" && status.value==="start"){
          console.log("Betting currently off. Attempting to set values and turn on.");

          usingNonBaseValue = numLossesSinceLastWin>=lossThreshold;

          if(!(!!betAmountField.attributes['disabled']) && !usingNonBaseValue){
            betAmountField.focus();
            if(document.execCommand('selectAll', false, null)){
              document.execCommand('insertText', false, baseValue);
            }
          }
          else{
            if(usingNonBaseValue){
              console.log("Currently on a losing streak. Not resetting the Bet Amount Field");
            }
            else{
              console.log("Bet Amount Field was disabled. Attempting to retry setting the value;")
              return;
            }
          }

          if(!(!!cashoutMultiplier.attributes['disabled'])){
            cashoutMultiplier.focus();
            if(document.execCommand('selectAll', false, null)){
              document.execCommand('insertText', false, cashoutMP);
            }
          }
          else{
            console.log("Cashout Multiplier was disabled. Attempting to retry setting the value;")
            return;
          }

          onLossIncreaseByButton.click();
          await pauseExecution(250);
          if(!(!!onLossIncreaseField.attributes['disabled'])){
            onLossIncreaseField.focus();
            if(document.execCommand('selectAll', false, null)){
              document.execCommand('insertText', false, onLossValue);
            }
          }
          else{
            console.log("On Loss Increase Field was disabled. Attempting to retry setting the value;")
            return;
          }

          await pauseExecution(100);
          status = autoBetButton.attributes["data-autobet-status"];
          if(status.value==="start" && (parseFloat(betAmountField.value)==parseFloat(baseValue) || usingNonBaseValue) && parseFloat(cashoutMultiplier.value)==parseFloat(cashoutMP) && parseFloat(onLossIncreaseField.value)==parseFloat(onLossValue)){
            console.log("Auto restart confirmed.");
            await pauseExecution(1000);
            autoBetButton.focus();
            autoBetButton.click();
            console.log("Clicked Auto Bet")
          }
          else{
            console.log("Loaded values are incorrect: ", status.value, betAmountField.value, cashoutMultiplier.value, onLossIncreaseField.value);
          }
        }
      }
    }
  }
  else{
    if(autoModeButton.className.split(" ").includes("active")){
      let autoBetButton = document.querySelectorAll('.game-sidebar button')[12]
      let test = autoBetButton.attributes["data-test"];
      let status = autoBetButton.attributes["data-autobet-status"];

      if(test.value==="auto-bet-button" && status.value==="stop" && usingNonBaseValue){
        if(numLossesSinceLastWin===0){
          autoBetButton.click();
          console.log("Stopping Auto Bet to reset Base Value.");
        }
      }
    }
  }
}

function reloadPage(){
  if(!keepRunning) return;
  location.reload();
}

async function claimReload(){
  document.querySelectorAll('button[data-test="user-dropdown-toggle"]')[0].click()
  await pauseExecution(500);
  document.querySelectorAll('.dropdown-scroll-content button')[2].click()
  await pauseExecution(1000);

  if(document.querySelectorAll('div[data-test="modal-vip"] .content-wrapper button span')[3].innerHTML!=="Reload") return;

  document.querySelectorAll('div[data-test="modal-vip"] .content-wrapper button')[3].click()
  await pauseExecution(1500);

  document.querySelectorAll('div[data-test="modal-vip"] button[data-test="coin-toggle"]')[0].click()
  await pauseExecution(200);

  document.querySelectorAll(`button[data-test="coin-toggle-currency-${preferredCoinForReload}"]`)[0].click()
  await pauseExecution(2000);

  document.querySelectorAll('div[data-test="modal-vip"] button')[7].click()
  await pauseExecution(3000);

  document.querySelectorAll('div[data-test="modal-vip"] button')[0].click()
}

async function claimRakeback(){
  document.querySelectorAll('button[data-test="user-dropdown-toggle"]')[0].click()
  await pauseExecution(500);
  document.querySelectorAll('.dropdown-scroll-content button')[2].click()
  await pauseExecution(1000);

  if(document.querySelectorAll('div[data-test="modal-vip"] .content-wrapper button span')[2].innerHTML!=="Rakeback") return;

  document.querySelectorAll('div[data-test="modal-vip"] .content-wrapper button')[2].click()
  await pauseExecution(1500);

  document.querySelectorAll('div[data-test="modal-vip"] button')[6].click()
  await pauseExecution(3000);

  document.querySelectorAll('div[data-test="modal-vip"] button')[0].click()
}

setInterval(mainScript, 2000)
setInterval(updateScriptBox, 500)
if(autoClaimReload) setInterval(claimReload, (1000*60*60)+Math.floor(Math.random() * (3000 - 1 + 1) + 1));
if(autoClaimRakeback) setInterval(claimRakeback, (1000*60*60)+Math.floor(Math.random() * (10000 - 5000 + 1) + 5000));