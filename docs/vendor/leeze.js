const LZ = {
    reactiveElements: [],
    buckets: {},

    /**
     * INTERNAL USE ONLY!  
     * Initializes Leeze.js.
     */
    init() {
        for (elem of document.querySelectorAll("[lz-reactive]")) {
            LZ.addReactiveElement(elem);
        }
        const htmlElement = document.querySelector("html");
        const observerConfig = { attributes: false, childList: true, subtree: true };
        const observer = new MutationObserver(LZ.domChanged);
    
        observer.observe(htmlElement, observerConfig);

        if ((typeof LZLoadCallback) === "function") {
            LZLoadCallback();
        }
    },

    /**
     * INTERNAL USE ONLY!  
     * Callback for MutationObserver.
     * @param {MutationRecord[]} mutationList The list of mutations occurred.
     * @param {MutationObserver} _observer The observer that invoked the callback.
     */
    domChanged(mutationList, _observer) {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                for (node of mutation.addedNodes) {
                    if (node.nodeName.startsWith("#")) continue;
                    if (node.getAttribute("lz-reactive") != null) {
                        LZ.addReactiveElement(node);
                    }
                }
                for (node of mutation.removedNodes) {
                    if (node.nodeName.startsWith("#")) continue;
                    LZ.removeReactiveElement(node);
                }
            }
        }
    },

    /**
     * INTERNAL USE ONLY!  
     * Add the specified element to the reactive elements collection.  
     * If the element has the `lz-source` attribute, the element with that id will be used as the source of the content value.  
     * The element MUST be an `input` element.
     * @param {Element} elem The reactive element to add to the collection.
     */
    addReactiveElement(elem) {
        LZ.reactiveElements.push(elem);
        const sourceElemId = elem.getAttribute("lz-source");
        if (sourceElemId !== null) {
            const sourceElem = document.getElementById(sourceElemId);
            if (sourceElem !== null) {
                if (sourceElem.tagName.toLowerCase() === "input") {
                    sourceElem.oninput = function() {
                        if ((mode = elem.getAttribute("lz-mode")) === "content") {
                            elem.innerHTML = sourceElem.value;
                        } else {
                            elem.textContent = sourceElem.value;
                        }
                        LZ._setValue("__LZ_auto_" + sourceElemId, sourceElem.value, false, sourceElem);
                    };
                    sourceElem.oninput();
                }
            }
        }
    },

    /**
     * INTERNAL USE ONLY!  
     * Remove the specified element from the reactive elements collection.  
     * If the element has the `lz-source` attribute, and if that element is an `input` element, its `oninput` event will be set to `null`.
     * @param {Element} elem The reactive element to remove from the collection.
     */
    removeReactiveElement(elem) {
        let i = LZ.reactiveElements.indexOf(elem);
        if (i != -1) {
            LZ.reactiveElements.splice(i, 1);
        }
        const sourceElemId = elem.getAttribute("lz-source");
        if (sourceElemId !== null) {
            const sourceElem = document.getElementById(sourceElemId);
            if (sourceElem !== null) {
                if (sourceElem.tagName.toLowerCase() === "input") {
                    sourceElem.oninput = null;
                    LZ.removeValue("__LZ_auto_" + sourceElemId);
                }
            }
        }
    },

    /**
     * INTERNAL USE ONLY!  
     * Execute a function by name.  
     * Based off of https://stackoverflow.com/a/359910.
     * @param {string} functionName The name of the function. Can be a full qualification (namespace.function).
     * @param  {...any} args The arguments to pass to the function.
     * @returns The value returned from the called function.
     */
    executeFunctionByName(functionName, ...args) {
        const namespaces = functionName.split(".");
        const func = namespaces.pop();
        let context = window;
        for (let i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }
        return context[func].apply(context, args);
    },

    /**
     * INTERNAL USE ONLY!  
     * Set (or update) the value of the specified bucket.  
     * If the bucket already existed or `forceChange` is `true`, the function in the `lz-onchange` attribute is executed.
     * @param {string} bucketName The name of the bucket to be set/updated.
     * @param {*} val The desired value.
     * @param {boolean} forceChange (Optional) Whether or not `lz-onchange` should be forcefully executed. Defaults to `false`.
     * @param {Element} sourceOfChange (Optional) The element that caused the change or `null` if the change was caused by something else.
     */
    _setValue(bucketName, val, forceChange = false, sourceOfChange = null) {
        let existed = LZ.getValue(bucketName) != null;
        LZ.buckets[bucketName] = val;
        for (elem of LZ.reactiveElements) {
            const mode = elem.getAttribute("lz-mode");
            if (elem.getAttribute("lz-bucket") == bucketName) {
                if (mode === "content") {
                    elem.innerHTML = val;
                } else {
                    elem.textContent = val;
                }
            }
            if (existed === true || forceChange === true) {
                if ((v = elem.getAttribute("lz-onchange")) != null) {
                    LZ.executeFunctionByName(v, val, sourceOfChange);
                }
            }
        }
    },

    /**
     * Set (or update) the value of the specified bucket.  
     * If the bucket already existed or `forceChange` is `true`, the function in the `lz-onchange` attribute is executed.
     * @param {string} bucketName The name of the bucket to be set/updated.
     * @param {*} val The desired value.
     * @param {boolean} forceChange (Optional) Whether or not `lz-onchange` should be forcefully executed. Defaults to `false`.
     */
    setValue(bucketName, val, forceChange = false) {
        LZ._setValue(bucketName, val, forceChange);
    },

    /**
     * Set (or update) the value of the specified bucket to the specified element's value.  
     * If the element does not exist, the action is aborted.  
     * If the bucket already existed or `forceChange` is `true`, the function in the `lz-onchange` attribute is executed.
     * @param {string} bucketName The name of the bucket to be set/updated.
     * @param {string} elementSelector The selector of the element to get the value from.
     * @param {("text"|"content")} mode (Optional) The mode of operation. `"text"` for text content, `"content"` for HTML. Defaults to `"text"`.
     * @param {boolean} forceChange (Optional) Whether or not `lz-onchange` should be forcefully executed. Defaults to `false`.
     */
    setValueFromElement(bucketName, elementSelector, mode = "text", forceChange = false) {
        const elem = document.querySelector(elementSelector);
        if (elem === null) return;
        let value = undefined;
        if ("value" in elem) {
            value = elem.value;
        } else {
            if (mode === "content") {
                value = elem.innerHTML;
            } else {
                value = elem.textContent;
            }
        }
        LZ._setValue(bucketName, value, forceChange);
    },

    /**
     * Set (or update) the value of the specified bucket to the specified element's value.  
     * If the element does not exist, the action is aborted.  
     * This is a faster version of `setValueFromElement`.  
     * If the bucket already existed or `forceChange` is `true`, the function in the `lz-onchange` attribute is executed.
     * @param {string} bucketName The name of the bucket to be set/updated.
     * @param {string} elementId The id of the element to get the value from.
     * @param {("text"|"content")} mode (Optional) The mode of operation. `"text"` for text content, `"content"` for HTML. Defaults to `"text"`.
     * @param {boolean} forceChange (Optional) Whether or not `lz-onchange` should be forcefully invoked. Defaults to `false`.
     */
    setValueFromElementId(bucketName, elementId, mode = "text", forceChange = false) {
        const elem = document.getElementById(elementId);
        if (elem === null) return;
        let value = undefined;
        if ("value" in elem) {
            value = elem.value;
        } else {
            if (mode === "content") {
                value = elem.innerHTML;
            } else {
                value = elem.textContent;
            }
        }
        LZ._setValue(bucketName, value, forceChange);
    },

    /**
     * Get the value of the specified bucket.
     * @param {string} bucketName The name of the variable.
     * @returns The value of the bucket if valid, else `null`.
     */
    getValue(bucketName) {
        if (bucketName in LZ.buckets) {
            return LZ.buckets[bucketName];
        }
        return null;
    },

    /**
     * Changes the specified bucket value by the specified delta.  
     * Intended to be used with numbers.
     * @param {string} bucketName The name of the bucket to change.
     * @param {number} delta The desired change amount.
     */
    updateValue(bucketName, delta) {
        LZ._setValue(bucketName, LZ.getValue(bucketName) + delta);
    },

    /**
     * Removes the bucket with the specified name.
     * @param {string} bucketName The name of the bucket to remove.
     */
    removeValue(bucketName) {
        if (bucketName in LZ.buckets) {
            delete LZ.buckets[bucketName];
        }
    }
};

window.onload = LZ.init;