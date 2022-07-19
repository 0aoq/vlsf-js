export default {
    // base conversion of console object
    "Global.Out": {
        "ApiType": "js.web",
        "ConversionObject": `Global.Out = console.log`
    },

    // base conversion of document object
    "Web.Page": {
        "ApiType": "js.web.dom",
        "ConversionObject": `Web.Page = {Query:${function (query) {
            return document.querySelector(query)
        }.toString()}};`
    },

    // base conversion of window object
    "Web.Window": {
        "ApiType": "js.web.dom",
        "ConversionObject": `Web.Window = {Page:Web.Page,Location:window.location,Storage:{Local:window.localStorage,Session:window.sessionStorage}};`
    },

    // conversion of eventListener object
    "Web.Events": {
        "ApiType": "js.web.dom.node",
        "ConversionObject": `Web.Events = {onClientEvent:${function (node, event, callback) {
            return node.addEventListener(event, callback)
        }.toString()},fireClientEvent:${function (node, event) {
            return node.dispatchEvent(new Event(event))
        }.toString()}}`
    },

    // conversion of http api
    "Global.Http": {
        "ApiType": "js.http",
        "ConversionObject": `Global.Http = {
            Fetch: ${function (url, format) {
                return new Promise((resolve, reject) => {
                    fetch(url).then(res => format === "json" ? res.json() : res.text()).then((result) => resolve(result)).catch(err => reject)
                })
            }.toString()}
        }`
    }
}