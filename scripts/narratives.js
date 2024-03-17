const MAX_WAIT_MS_FOR_CHROME_STORAGE = 75;
/**
 * Clicks on the collapse button for all open diffs.
 */
function closeAllOpenDiffs() {
    const collapseButtons = document.querySelectorAll(".file.Details.Details--on > .file-header > .file-info > button");
    collapseButtons.forEach((elem) => elem.click());
}
/**
 * Helper function for making the HTML for github-style button.
 */
function makeButtonHTML(content, aria_label) {
    return `<button target="_blank" aria-label="${aria_label}" data-view-component="true" class="Button--secondary Button--small Button">
    <span class="Button-content">
       <span class="Button-label">
          ${content}
       </span>
    </span>
 </button>`;
}
function showLoadingIndicator() {
    console.log("start loading");
}
function hideLoadingIndicator() {
    console.log("stop loading");
}
/**
 * Returns a div that contains a button for showing/hiding drag and drop handles.
 * The div is not added to the DOM: that should be done by the caller.
 */
function makeControlsDiv() {
    const handleControlDiv = document.createElement('div');
    handleControlDiv.className = "diffbar-item dropdown js-reviews-container";
    handleControlDiv.innerHTML = makeButtonHTML("Reorder diffs", "Show Drag and Drop Handles") + makeButtonHTML("Hide handles", "Hide Drag and Drop Handles");
    handleControlDiv.setAttribute("style", "margin-right: 8px; margin-left: 8px");
    const showButton = handleControlDiv.children[0];
    const hideButton = handleControlDiv.children[1];
    hideButton.style.display = "none";
    showButton.addEventListener("click", () => {
        document.querySelectorAll(".narratives-dnd-handle").forEach(handle => handle.style.display = "inline");
        closeAllOpenDiffs();
        showButton.style.display = "none";
        hideButton.style.display = "inline-block";
    });
    hideButton.addEventListener("click", () => {
        document.querySelectorAll(".narratives-dnd-handle").forEach(handle => handle.style.display = "none");
        showButton.style.display = "inline-block";
        hideButton.style.display = "none";
    });
    return { handleControlDiv };
}
/**
 * Returns a div that contains a button for copying the order.
 * The div is not added to the DOM: that should be done by the caller.
 */
function makeCopyButton() {
    let copyButtonDiv = document.createElement('div');
    copyButtonDiv.className = "diffbar-item dropdown js-reviews-container";
    const inputForClipboardHTML = `<input disabled type="text" id="narratives-input" style="display: none" aria-label="Narratives Order">`;
    const copyButtonHTML = makeButtonHTML(`
          <svg aria-hidden="true" focusable="false" role="img" class="octicon octicon-copy" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display:inline-block;user-select:none;vertical-align:text-bottom;overflow:visible">
             <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
             <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
          </svg>
          Copy Order
       `, "Copy Order");
    copyButtonDiv.innerHTML = inputForClipboardHTML + copyButtonHTML;
    let copyButton = copyButtonDiv.querySelector('button');
    let input = copyButtonDiv.querySelector('input');
    copyButton.setAttribute("disabled", "true");
    copyButtonDiv.style.marginRight = "8px";
    copyButton.addEventListener("click", () => {
        input.select();
        input.setSelectionRange(0, 1000000); // per w3 school
        navigator.clipboard.writeText(input.value);
    });
    const setCopyPasteValue = (content) => {
        copyButton.removeAttribute("disabled");
        input.value = content;
    };
    return { copyButtonDiv, setCopyPasteValue };
}
function setupHandles() {
    function makeDragAndDropHandle() {
        const span = document.createElement("span");
        span.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-grabber">
            <path d="M10 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-4 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5-9a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
        </svg>`;
        span.className = "narratives-dnd-handle";
        span.setAttribute("style", "cursor: grab; color: var(--fgColor-muted, var(--color-fg-muted)); display: none");
        return span;
    }
    document.querySelectorAll(".file-header").forEach(container => {
        container.insertBefore(makeDragAndDropHandle(), container.firstChild);
    });
}
const MAX_CONTAINERS_TO_HANDLE = 100;
/**
 * Github puts the diffs into several different containers, this function combines them to one
 * so sortable works.
 */
function combineContainers() {
    const containers = document.querySelectorAll(".js-diff-progressive-container");
    if (containers.length <= 1) {
        return;
    }
    const newContainer = containers[0];
    containers.forEach((container, index) => {
        if (index > 0) {
            for (let counter = 0; counter < MAX_CONTAINERS_TO_HANDLE && container.children.length > 0; counter++) {
                // [0] is intentional as appendChild moves the first child
                newContainer.appendChild(container.children[0]);
            }
        }
    });
}
var presetOrder = null;
// limit is 10_000_000
const STORAGE_LIMIT = 5_000_000;
function checkStorageLimits() {
    // @ts-ignore
    chrome.storage.local.getBytesInUse(null, // all keys
    (bytes => {
        if (bytes > STORAGE_LIMIT) {
            // @ts-ignore
            chrome.storage.local.get(null, // all keys
            // all keys
            data => {
                const timestamps = Object.values(data).map(({ timestamp }) => timestamp);
                const minTimestamp = Math.min.apply(null, timestamps);
                const keysToDelete = Object.keys(data).filter(key => data[key].timestamp === minTimestamp);
                if (keysToDelete.length > 0) {
                    // @ts-ignore
                    chrome.storage.local.remove(keysToDelete, () => {
                        setTimeout(checkStorageLimits, 50);
                    });
                }
            });
        }
    }));
}
function saveOrderToStorage(order) {
    // @ts-ignore
    chrome.storage.local.set({
        [document.location.pathname]: {
            order,
            timestamp: (new Date()).getTime(),
            version: 1
        }
    }, () => checkStorageLimits());
}
function getOrderFromStorage() {
    return new Promise(resolve => {
        let resolved = false;
        // @ts-ignore
        chrome.storage.local.get(document.location.pathname, (data) => {
            if (resolved) {
                // chrome storage was way too slow, unlikely case
                return;
            }
            if (document.location.pathname in data) {
                resolve(data[document.location.pathname].order);
            }
            else {
                resolve(null);
            }
            resolved = true;
        });
        setTimeout(() => {
            if (!resolved) {
                resolve(null);
                resolved = true;
            }
        }, MAX_WAIT_MS_FOR_CHROME_STORAGE);
    });
}
const SEARCH_PARAMS_KEY = "diff-order";
function getOrderFromQueryString() {
    const searchParams = new URLSearchParams(document.location.search);
    const diffOrder = searchParams.get(SEARCH_PARAMS_KEY);
    if (diffOrder !== null) {
        return JSON.parse(decodeURIComponent(diffOrder));
    }
    return null;
}
function makeURLWithOrderInQueryString(order) {
    const encodedOrder = encodeURIComponent(JSON.stringify(order));
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.append(SEARCH_PARAMS_KEY, encodedOrder);
    return `${window.location.href.split('?')[0]}?${searchParams.toString()}`;
}
function determineInitialOrder() {
    const orderingFromQueryString = getOrderFromQueryString();
    if (orderingFromQueryString !== null) {
        saveOrderToStorage(orderingFromQueryString);
        return new Promise(resolve => resolve(orderingFromQueryString));
    }
    return getOrderFromStorage();
}
function setupNarratives(initialOrder) {
    // initialOrder takes a max of MAX_WAIT_MS_FOR_CHROME_STORAGE to resolve
    initialOrder.then(initialOrder => {
        hideLoadingIndicator();
        let inputParent = document.querySelector(".pr-review-tools");
        if (inputParent === null) {
            return;
        }
        combineContainers();
        setupHandles();
        let { copyButtonDiv, setCopyPasteValue } = makeCopyButton();
        const { handleControlDiv } = makeControlsDiv();
        inputParent.insertBefore(handleControlDiv, inputParent.children[1]);
        inputParent.insertBefore(copyButtonDiv, inputParent.children[1]);
        const diffsAndFileContent = [];
        document.querySelectorAll("div.file.js-file").forEach(diffContainer => {
            diffsAndFileContent.push({
                diffContainer,
                // the file content is the first child
                fileContentElement: diffContainer.children[1]
            });
        });
        // @ts-ignore: sortable is imported by chrome
        let sortable = Sortable.create(document.getElementsByClassName("js-diff-progressive-container")[0], {
            dataIdAttr: 'data-file-path',
            handle: ".narratives-dnd-handle",
            onUpdate() {
                const order = sortable.toArray();
                setCopyPasteValue(makeURLWithOrderInQueryString(order));
                saveOrderToStorage(order);
            },
            onChoose: function () {
                closeAllOpenDiffs();
                // sortable is slow if the fileContent is in the dom
                diffsAndFileContent.forEach(({ fileContentElement }) => fileContentElement.remove());
            },
            onUnchoose: function () {
                // add back the content we removed on choose
                diffsAndFileContent.forEach(({ diffContainer, fileContentElement }) => setTimeout(() => diffContainer.appendChild(fileContentElement)), 0);
            }
        });
        if (initialOrder !== null) {
            sortable.sort(initialOrder);
            setCopyPasteValue(makeURLWithOrderInQueryString(initialOrder));
        }
    });
}
const CHECK_TIME_MS = 50;
const MAX_WAIT_TIME = 5000;
/**
 * Wait for all files to load
 */
function waitForAllDiffsToLoadThenSetupNarratives(initialOrder) {
    const filesCounter = document.querySelector("#files_tab_counter");
    if (filesCounter === null) {
        return;
    }
    // Make sure we don't setup twice
    if (filesCounter.getAttribute("narratives-setup-started") !== null) {
        return;
    }
    filesCounter.setAttribute("narratives-setup-started", "true");
    showLoadingIndicator();
    const numFiles = parseInt(filesCounter.innerHTML);
    if (numFiles > MAX_CONTAINERS_TO_HANDLE) {
        return;
    }
    let counter = 0;
    function check() {
        if (counter * CHECK_TIME_MS > MAX_WAIT_TIME) {
            return;
        }
        if (document.querySelectorAll("copilot-diff-entry").length == numFiles) {
            setupNarratives(initialOrder);
        }
        else {
            counter += 1;
            setTimeout(check, CHECK_TIME_MS);
        }
    }
    check();
}
// @ts-ignore: window.navigation exists on up to date versions of chrome
window.navigation.addEventListener("navigate", function () {
    // only run on pull request page
    if (document.location.pathname.match(/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+\/files$/)) {
        const initialOrder = determineInitialOrder();
        // let other handlers finish
        setTimeout(() => waitForAllDiffsToLoadThenSetupNarratives(initialOrder), 0);
    }
});
