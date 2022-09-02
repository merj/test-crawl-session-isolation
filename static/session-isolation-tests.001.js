// URL where to send POST messages
const url = new URL("http://localhost:9007/b");

// Create default message object (or beacon)
let beacon = { "pageURL": document.URL };
beacon.tests = [];

const pageTitle = document.title;

// Add test to the page title
function appendTestToPageTitle(test){
    document.title = document.title + " - " + test;
}

 // Add test to the list on page
function appendTestToList(page){
    let ul = document.getElementById("list")
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(page));
    ul.appendChild(li);
}

// Check if test already seen, if not add that in memory and in the list of failed tests
function checkFailedTest(test){
    if(!seenTests.has(test)){
        // Add the test to the Set of already seen tests
        seenTests.add(test);

        // Add the failed test to the beacon
        beacon.tests.push(test);
        
        // Add test to the page title
        appendTestToPageTitle(test);

        // Add test to the list of failed test on page
        appendTestToList(test);
    }
}

// Send the message back to the server at load event
window.addEventListener('load', () => {
    sendBeacon(beacon);    
});

// Send the message back to the server at visibilitychange event if the visibility state is hidden
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        sendBeacon(beacon);
    }
});

// Send a POST request with a body that contains page URL and failed tests
function sendBeacon(data) {
    fetch(url, {
        keepalive: true,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        })
        .then(response => {
            console.log("Sent.");
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}


/* 
    Tests setup
*/

// Run tests every X ms
const timeToWait = 40;

// Create a Set to keep track of already seen tests
const seenTests = new Set();

// Save all the current page tests to the seenTests Set to avoid sending them in the beacon
seenTests.add("BC/"+pageTitle);
seenTests.add("SW/"+pageTitle);
seenTests.add("LS/"+pageTitle);
seenTests.add("SS/"+pageTitle);
seenTests.add("IDB/"+pageTitle);
seenTests.add("CK/"+pageTitle);


/* 
    Cookie test
*/

// Set cookie for the current page
document.cookie = "CK/"+pageTitle+"=True";

// Get all cookies and look for failed tests every 40ms
setInterval(() => {
    document.cookie.split(';').forEach(function(cookie) {
        const [cookieName, value] = cookie.split('=').map(c => c.trim());
        if (cookieName != '') {
            checkFailedTest(cookieName);
        }
    });
}, timeToWait);


/* 
    BroadcastChannel Test
*/

// Create / connect to the Broadcast Channel
const channel = new BroadcastChannel("channellone");

// Listen for new messages (failed tests) from the Broadcast Channel
channel.onmessage = (e) => {
    checkFailedTest(e.data);
}

// Send a message to the Broadcast Channel every 40 ms
setInterval(() => {
    channel.postMessage("BC/"+pageTitle);
}, timeToWait);


/* 
    Shared Worker Test
*/

// Create new sharedworker
const worker = new SharedWorker("/sharedworker.001.js");

// Listen for new message (failed tests) from the Shared Worker
worker.port.onmessage = (e) => {
    checkFailedTest(e.data);
}

// Send a message to the Shared Worker every 40 ms
setInterval(() => {
    worker.port.postMessage("SW/"+pageTitle);
}, timeToWait);


/* 
    LocalStorage Test
*/

// Set LocalStorage current page item
localStorage.setItem("LS/"+pageTitle, true);

// Get all LocalStorage items and look for failed tests every 40ms
setInterval(() => {
    elements = Object.keys(localStorage);
    for (let i = 0; i < elements.length; ++i) {
        const e = elements[i];
        checkFailedTest(e);
    }
}, timeToWait);


/* 
    SessionStorage Test
*/

// Set SessionStorage current page item
sessionStorage.setItem("SS/"+pageTitle, true);

// Get all SessionStorage items and look for failed tests every 40ms
setInterval(() => {
    elements = Object.keys(sessionStorage);
    for (let i = 0; i < elements.length; ++i) {
        const e = elements[i];
        checkFailedTest(e);
    }
}, timeToWait);


/* 
    IndexedDB Test
*/

const dbName = "SessionIsolationTest";

function idbConn(){
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = event => {
    const db = event.target.result;
    const objStore = db.createObjectStore("Pages", { keyPath: "page" });
    let transaction = event.target.transaction;
    transaction.oncomplete =
    function() {    
        useDatabase(db);
        }
    };
    request.onsuccess = event => {
        const db = event.target.result;
        useDatabase(db);
        return;
    };
}

function useDatabase(db){
    const transaction = db.transaction(["Pages"], "readwrite");
    transaction.onerror = event => {
        // Handle errors
    };
    const objectStore = transaction.objectStore("Pages");
    var req = objectStore.openCursor("IDB/"+pageTitle);
    req.onsuccess = function(e) {
        let pagekey = "IDB/"+pageTitle;
        var cursor = e.target.result; 
        if (!cursor) { 
            // if key doesn't already exist, add it
            objectStore.add({"page": pagekey})
        }
        checkFailedTest(pagekey);
    };
    objectStore.getAll().onsuccess = event => {
        pages = event.target.result;
        pages.forEach(element => {
            checkFailedTest(element.page);
        });
    };
}

setInterval(idbConn, timeToWait);


/*
    Simulate a slow page to get all information
*/

// Unoptimised Fibonacci function
function fibonacci(index){
    if(index<=0){ return 0; }
    if(index===1){ return 1; }
    if(index===2){ return 2; }

    return fibonacci(index-2) + fibonacci(index-1);
}

// Slow down the load of the page by using a fibonacci loop
fibonacci(42)