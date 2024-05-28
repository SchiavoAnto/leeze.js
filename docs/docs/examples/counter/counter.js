// This is used to set a default initial value.
function LZLoadCallback() {
    LZ.setValue("counterValue", 69);
}

function incrementCounter() {
    LZ.updateValue("counterValue", 1);
}

function decrementCounter() {
    LZ.updateValue("counterValue", -1);
}

function resetCounter() {
    LZ.setValue("counterValue", 0);
}