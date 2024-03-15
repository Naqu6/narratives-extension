function makeButtonElement() {
    let buttonDiv = document.createElement('div');
    buttonDiv.className = "diffbar-item dropdown js-reviews-container";
    buttonDiv.innerHTML = `<button id="narratives-button" style="border-top-right-radius: 0; border-bottom-right-radius: 0" target="_blank" aria-label="Copy Narratives Order" data-view-component="true" class="Button--secondary Button--small Button">
    <span class="Button-content">
       <span class="Button-label">
          <svg aria-hidden="true" focusable="false" role="img" class="octicon octicon-copy" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display:inline-block;user-select:none;vertical-align:text-bottom;overflow:visible">
             <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
             <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
          </svg>
       </span>
    </span>
 </button>`; 
    let button = buttonDiv.querySelector('button');
    
    return { buttonDiv, button };
}

function makeInputElement() {
    let inputDiv = document.createElement("div")
    inputDiv.className = "diffbar-item dropdown js-reviews-container";
    inputDiv.style = "margin-right: 16px"; 
    inputDiv.innerHTML = `
        <input
            type="text"
            id="narratives-input"
            style="line-height: 16px; padding: 5px 5px; border-top-left-radius: 0; border-bottom-left-radius: 0"
            class="form-control input-block pl-1"
            placeholder="Paste Narratives Order"
            aria-label="Paste Narratives Order"
        >`;
    let input = inputDiv.querySelector("input");
    return { inputDiv, input };
}

const MAX_ITERS = 100 // prevent infinite loops

/**
 * Github puts the diffs into several different containers, this function combines them to one
 * so sortable works.
 */
function combineContainers() {
    const containers = document.querySelectorAll(".js-diff-progressive-container")
    if (containers.length <= 1) {
        return;
    }

    const newContainer = containers[0];
    containers.forEach((container, index) => {
        if (index > 0) {
            for (let counter = 0; counter < MAX_ITERS & container.children.length > 0; counter++) {
                // [0] is intentional as appendChild moves the first child
                newContainer.appendChild(container.children[0])
            }
        }
    })
}

/**
 * When someone starts dragging, we do two things:
 * - collapse all diffs, so just the header shows
 * - remove the content of the files from the DOM to make the dragging faster
 * 
 * We then lazily add back the content when someone clicks the expand button
 */
function setupDiffContentRemover() {
    const diffIdToElement = new Map()
    const hiddenElements = new Set()

    document.querySelectorAll("div.file.js-file").forEach(fileContainer => {
        const fileContentElement = fileContainer.children[1]
        diffIdToElement.set(fileContainer.id, fileContentElement)

        fileContainer.querySelector(
            ".file-header > .file-info > button"
        ).addEventListener("click", () => {
            if (hiddenElements.has(fileContainer.id)) {
                fileContainer.appendChild(fileContentElement)

                hiddenElements.delete(fileContainer.id)
            }
        })
    })

    const onDragStart = () => {
        // Close all open diffs
        document.querySelectorAll(
            ".file.Details.Details--on > .file-header > .file-info > button"
        ).forEach(elem => elem.click())

        diffIdToElement.forEach((element, id) => {
            element.remove()
            hiddenElements.add(id)
        })
    }

    return { onDragStart }
}


function setupNarratives() {
    let inputParent = document.querySelector(".pr-review-tools")

    // Make sure we don't setup twice
    if (inputParent.getAttribute("narratives-setup") !== null) {
        return
    }
    inputParent.setAttribute("narratives-setup", true)

    combineContainers()

    let { inputDiv, input } = makeInputElement()
    let { buttonDiv, button } = makeButtonElement()

    inputParent.insertBefore(inputDiv, inputParent.children[1])
    inputParent.insertBefore(buttonDiv, inputParent.children[1])

    const { onDragStart } = setupDiffContentRemover()

    let sortable = Sortable.create(
        document.getElementsByClassName("js-diff-progressive-container")[0],
        {
            dataIdAttr: 'data-file-path',
            handle: ".file-header.file-header--expandable",
            onUpdate() {
                input.value = JSON.stringify(sortable.toArray())
            },
            onChoose: function() {
                onDragStart()
            },
        }
    )

    
    button.addEventListener("click", () => {
        input.select();
        input.setSelectionRange(0, 1000000); // per w3 school
        navigator.clipboard.writeText(input.value);
    })

    function setOrder(orderAsString) {
        let result = JSON.parse(orderAsString)
        sortable.sort(result)
        
    }

    input.addEventListener("paste", (event) => {
        setOrder(event.clipboardData.getData("text"))
    })
    input.addEventListener("change", () => {
        setOrder(input.value)
    })
}

const CHECK_TIME_MS = 50
const MAX_WAIT_TIME = 5000

/**
 * Wait for all files to load
 */
function waitForProgressiveContainerThenSetupNarratives() {
    const numFiles = parseInt(document.querySelector("#files_tab_counter").innerText)
    let counter = 0

    function check() {
        if (counter * CHECK_TIME_MS > MAX_WAIT_TIME) {
            return
        }

        if (document.querySelectorAll("copilot-diff-entry").length == numFiles) {
            setupNarratives()
        }  else {
            counter += 1
            setTimeout(check, CHECK_TIME_MS)
        }
    }

    check()
}

window.navigation.addEventListener("navigate", function() {
    // only run on pull request page
    if (document.location.pathname.match(/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+\/files$/)) {
        setTimeout(waitForProgressiveContainerThenSetupNarratives, 0)
    }
})
