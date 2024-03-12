function makeButtonElement() {
    var button = document.createElement('button');
    button.style = "float: left; width: 16px; background: white; border: none; margin-top: 7.5px; padding: 0px; color: rgb(101, 109, 118)";
    button.title = "Copy diff ordering"
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>`;

    return button
}

function makeInputElement() {
    let input = document.createElement("input")
    input.type = "text"
    input.className = "css-class-name"
    input.style = "float: left;width: 80px;font-size: 12px;margin-left: 10px;margin-right: 10px;margin-top: 5px; text-align: center"
    input.placeholder = "Paste Order"

    return input
}

const MAX_ITERS = 100

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

function setupNarratives() {
    let inputParent = document.querySelector(".pr-review-tools")

    if (inputParent.getAttribute("narratives-setup") !== null) {
        return
    }

    inputParent.setAttribute("narratives-setup", true)
    combineContainers()

    let input = makeInputElement()
    let button = makeButtonElement()

    inputParent.insertBefore(input, inputParent.children[1])
    inputParent.insertBefore(button, inputParent.children[1])

    let sortable = Sortable.create(
        document.getElementsByClassName("js-diff-progressive-container")[0],
        {
            dataIdAttr: 'data-file-path',
            onUpdate() {
                input.value = JSON.stringify(sortable.toArray())
            }
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
    if (document.location.pathname.match(/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/pull\/\d+\/files$/)) {
        waitForProgressiveContainerThenSetupNarratives()
    }
})
