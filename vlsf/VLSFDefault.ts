export default {
    // base conversion of console object
    "Global.Out": {
        "ApiType": "js.web",
        "ConversionObject": `Global.Out = console.log`
    },

    // base conversion of document object
    "Web.Page": {
        "ApiType": "js.web.dom",
        "ConversionObject": `Web.Page = {Query:${function (query: string) {
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
        "ConversionObject": `Web.Events = {onClientEvent:${function (node: Node, event: string, callback: EventListenerOrEventListenerObject) {
            return node.addEventListener(event, callback)
        }.toString()},fireClientEvent:${function (node, event) {
            return node.dispatchEvent(new Event(event))
        }.toString()}}`
    },

    // conversion of http api
    "Global.Http": {
        "ApiType": "js.http",
        "ConversionObject": `Global.Http = {
            Fetch: ${function (url: string, format: "json" | any) {
                return new Promise((resolve, reject) => {
                    fetch(url).then(res => format === "json" ? res.json() : res.text()).then((result) => resolve(result)).catch(err => reject)
                })
            }.toString()}
        }`
    },

    // global type functions
    "Global.Types": {
        "ApiType": "vl.util.types",
        "ConversionObject": `Global.Types = {
            Exists: ${function (data: any) {
                // evaluate if a value actually exists (isn't null or undefined)
                return (data !== undefined && data !== null)
            }.toString()},
            isNumber: ${function (number: any) {
                return !isNaN(number)
            }},
            IsOdd: ${function (number: number) {
                return Math.abs(number % 2) == 1
            }.toString()}
        }`
    },

    // string type functions
    "Types.String": {
        "ApiType": "vl.util.types.string",
        "ConversionObject": `VLSFGLOBAL.importType("String", {
            Between: ${function (start: string, end: string) {
                // check if start[1] is valid first
                // we don't have to check if end is valid because [0] will always return SOMETHING
                if (this.split(start)[1]) return this.split(start)[1].split(end)[0]
                else return ""
            }.toString()},
            TestThis: ${function () {
                return this
            }.toString()}
        })`
    },

    // number type functions
    "Types.Number": {
        "ApiType": "vl.util.types.number",
        "ConversionObject": `VLSFGLOBAL.importType("Number", {
            
        })`
    },

    // object type functions
    "Types.Object": {
        "ApiType": "vl.util.types.object",
        "ConversionObject": `VLSFGLOBAL.importType("Object", {
            
        })`
    }
}