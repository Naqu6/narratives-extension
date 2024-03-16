const SEARCH_PARAMS_KEY = "diff-order";
function makeButtonHTML(content) {
    return `<button target="_blank" aria-label="Copy Narratives Order" data-view-component="true" class="Button--secondary Button--small Button">
    <span class="Button-content">
       <span class="Button-label">
          ${content}
       </span>
    </span>
 </button>`;
}
function makeControlsDiv() {
    const handleControlDiv = document.createElement('div');
    handleControlDiv.className = "diffbar-item dropdown js-reviews-container";
    handleControlDiv.innerHTML = makeButtonHTML("Reorder diffs") + makeButtonHTML("Hide handles");
    handleControlDiv.setAttribute("style", "margin-right: 8px; margin-left: 8px");
    const showButton = handleControlDiv.children[0];
    const hideButton = handleControlDiv.children[1];
    hideButton.style.display = "none";
    showButton.addEventListener("click", () => {
        document.querySelectorAll(".narratives-dnd-handle").forEach(handle => handle.style.display = "inline");
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
function makeCopyButton() {
    let copyButtonDiv = document.createElement('div');
    copyButtonDiv.className = "diffbar-item dropdown js-reviews-container";
    copyButtonDiv.innerHTML = makeButtonHTML(`
          <svg aria-hidden="true" focusable="false" role="img" class="octicon octicon-copy" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display:inline-block;user-select:none;vertical-align:text-bottom;overflow:visible">
             <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
             <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
          </svg>
          Copy Order
       `);
    let copyButton = copyButtonDiv.querySelector('button');
    copyButton.setAttribute("disabled", "true");
    copyButtonDiv.style.marginRight = "8px";
    return { copyButtonDiv, copyButton };
}
function makeInputElement() {
    let inputDiv = document.createElement("div");
    inputDiv.className = "diffbar-item dropdown js-reviews-container";
    inputDiv.setAttribute("style", "margin-right: 16px");
    inputDiv.innerHTML = `
        <input
            disabled
            type="text"
            id="narratives-input"
            style="display: none"
            class="form-control input-block pl-1"
            placeholder="Paste Narratives Order"
            aria-label="Paste Narratives Order"
        >`;
    let input = inputDiv.querySelector("input");
    return { inputDiv, input };
}
function makeDragAndDropHandle() {
    const span = document.createElement("span");
    span.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-three-bars Button-visual">
        <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
    </svg>`;
    span.className = "narratives-dnd-handle";
    span.setAttribute("style", "cursor: grab; color: var(--fgColor-muted, var(--color-fg-muted)); display: none");
    return span;
}
function setupHandles() {
    document.querySelectorAll(".file-header").forEach(container => {
        container.insertBefore(makeDragAndDropHandle(), container.firstChild);
    });
}
const MAX_ITERS = 100; // prevent infinite loops
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
            for (let counter = 0; counter < MAX_ITERS && container.children.length > 0; counter++) {
                // [0] is intentional as appendChild moves the first child
                newContainer.appendChild(container.children[0]);
            }
        }
    });
}
const events_to_stop_propagation_in_header = ["drag", "dragstart", "mousedown", "touchstart", "pointerdown"];
/**
 * When someone starts dragging, we do two things:
 * - collapse all diffs, so just the header shows
 * - remove the content of the files from the DOM to make the dragging faster
 *
 */
function setupDiffContentRemover() {
    const containersAndElements = [];
    document.querySelectorAll("div.file.js-file").forEach(container => {
        containersAndElements.push({
            container,
            element: container.children[1]
        });
    });
    const onDragStart = () => {
        // Close all open diffs
        const collapseButtons = document.querySelectorAll(".file.Details.Details--on > .file-header > .file-info > button");
        collapseButtons.forEach((elem) => elem.click());
        // delete the heavy content
        containersAndElements.forEach(({ element }) => element.remove());
    };
    const onDragEnd = () => {
        // add all the content back we deleted
        containersAndElements.forEach(({ container, element }) => setTimeout(() => container.appendChild(element), 0));
    };
    return { onDragStart, onDragEnd };
}
var narrativeFromQueryString = null;
function setupNarratives() {
    let inputParent = document.querySelector(".pr-review-tools");
    if (inputParent === null) {
        return;
    }
    // Make sure we don't setup twice
    if (inputParent.getAttribute("narratives-setup") !== null) {
        return;
    }
    inputParent.setAttribute("narratives-setup", "true");
    combineContainers();
    setupHandles();
    let { inputDiv, input } = makeInputElement();
    let { copyButtonDiv, copyButton } = makeCopyButton();
    const { handleControlDiv } = makeControlsDiv();
    inputParent.insertBefore(inputDiv, inputParent.children[1]);
    inputParent.insertBefore(copyButtonDiv, inputParent.children[1]);
    inputParent.insertBefore(handleControlDiv, inputParent.children[1]);
    const { onDragStart, onDragEnd } = setupDiffContentRemover();
    function setInputValue(order) {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.append(SEARCH_PARAMS_KEY, encodeURIComponent(JSON.stringify(order)));
        input.value = `${window.location.href.split('?')[0]}?${searchParams.toString()}`;
    }
    // @ts-ignore: sortable is imported by chrome
    let sortable = Sortable.create(document.getElementsByClassName("js-diff-progressive-container")[0], {
        dataIdAttr: 'data-file-path',
        handle: ".narratives-dnd-handle",
        onUpdate() {
            setInputValue(sortable.toArray());
            copyButton.removeAttribute("disabled");
        },
        onChoose: function () {
            onDragStart();
        },
        onUnchoose: function () {
            onDragEnd();
        }
    });
    copyButton.addEventListener("click", () => {
        input.select();
        input.setSelectionRange(0, 1000000); // per w3 school
        navigator.clipboard.writeText(input.value);
    });
    function setOrder(orderAsString) {
        let result = JSON.parse(decodeURIComponent(orderAsString));
        sortable.sort(result);
        setInputValue(result);
    }
    if (narrativeFromQueryString !== null) {
        setOrder(narrativeFromQueryString);
        input.value = narrativeFromQueryString;
    }
}
const CHECK_TIME_MS = 50;
const MAX_WAIT_TIME = 5000;
/**
 * Wait for all files to load
 */
function waitForProgressiveContainerThenSetupNarratives() {
    const filesCounter = document.querySelector("#files_tab_counter");
    if (filesCounter === null) {
        return;
    }
    const numFiles = parseInt(filesCounter.innerHTML);
    let counter = 0;
    function check() {
        if (counter * CHECK_TIME_MS > MAX_WAIT_TIME) {
            return;
        }
        if (document.querySelectorAll("copilot-diff-entry").length == numFiles) {
            setupNarratives();
        }
        else {
            counter += 1;
            setTimeout(check, CHECK_TIME_MS);
        }
    }
    check();
}
function extractNarrativeFromQueryString() {
    const searchParams = new URLSearchParams(document.location.search);
    const diffOrder = searchParams.get(SEARCH_PARAMS_KEY);
    if (diffOrder !== null) {
        narrativeFromQueryString = diffOrder;
    }
}
// @ts-ignore: window.navigation exists on up to date versions of chrome
window.navigation.addEventListener("navigate", function () {
    extractNarrativeFromQueryString();
    // only run on pull request page
    if (document.location.pathname.match(/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+\/files$/)) {
        setTimeout(waitForProgressiveContainerThenSetupNarratives, 0);
    }
});
